<?php

namespace App\Services\SmsProviders;

use App\Contracts\SmsProviderInterface;
use App\DTOs\Sms\CountryDto;
use App\DTOs\Sms\ProductDto;
use App\DTOs\Sms\PriceDto;
use App\DTOs\Sms\PurchaseResultDto;
use App\DTOs\Sms\OrderStatusDto;
use App\DTOs\Sms\ProviderBalanceDto;
use App\Enums\SmsProvider;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GrizzlySmsProvider extends AbstractSmsProvider implements SmsProviderInterface
{
    // GrizzlySMS action constants
    protected const ACTION_GET_BALANCE = 'getBalance';
    protected const ACTION_GET_COUNTRIES = 'getCountries';
    protected const ACTION_GET_SERVICES = 'getServices';
    protected const ACTION_GET_PRICES = 'getPrices';
    protected const ACTION_GET_NUMBER = 'getNumber';
    protected const ACTION_GET_NUMBER_V2 = 'getNumberV2';
    protected const ACTION_GET_STATUS = 'getStatus';
    protected const ACTION_SET_STATUS = 'setStatus';

    // GrizzlySMS status constants
    protected const STATUS_WAIT_CODE = 'STATUS_WAIT_CODE';
    protected const STATUS_WAIT_RETRY = 'STATUS_WAIT_RETRY';
    protected const STATUS_WAIT_RESEND = 'STATUS_WAIT_RESEND';
    protected const STATUS_CANCEL = 'STATUS_CANCEL';
    protected const STATUS_OK = 'STATUS_OK';

    // setStatus action codes
    protected const SET_STATUS_CANCEL = 8;
    protected const SET_STATUS_FINISH = 6;
    protected const SET_STATUS_CONFIRM = 1;
    protected const SET_STATUS_RETRY = 3;

    public function __construct()
    {
        $this->baseUrl = config('services.grizzlysms.base_url', 'https://api.grizzlysms.com/stubs/handler_api.php');
        $this->apiKey = config('services.grizzlysms.api_key', '');
        $this->enabled = config('services.grizzlysms.enabled', true);
    }

    public function getIdentifier(): string
    {
        return SmsProvider::GRIZZLYSMS->value;
    }

    public function getDisplayName(): string
    {
        return SmsProvider::GRIZZLYSMS->displayName();
    }

    public function getBalance(): ProviderBalanceDto
    {
        $result = $this->makeRequest(self::ACTION_GET_BALANCE);

        if (!$result['success']) {
            return ProviderBalanceDto::failure($result['message'] ?? 'Failed to get balance');
        }

        $balance = $this->parseBalanceResponse($result['data']);

        return ProviderBalanceDto::success($balance, 'USD');
    }

    public function getCountries(): Collection
    {
        $result = $this->makeRequest(self::ACTION_GET_COUNTRIES);

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        // GrizzlySMS returns countries as id => name pairs or JSON object
        $data = $result['data'];

        if (is_string($data)) {
            // Try parsing as JSON
            $parsed = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data = $parsed;
            }
        }

        if (!is_array($data)) {
            return collect();
        }

        return collect($data)->map(function ($name, $code) {
            $displayName = is_array($name) ? ($name['eng'] ?? $name['name'] ?? "Country {$code}") : $name;
            return new CountryDto(
                code: (string) $code,
                name: $displayName,
                prefix: '',
            );
        })->values();
    }

    public function getProducts(string $country, string $operator = 'any'): Collection
    {
        $result = $this->makeRequest(self::ACTION_GET_SERVICES, [
            'country' => $this->mapCountryCode($country),
        ]);

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        $data = $result['data'];
        if (is_string($data)) {
            $parsed = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data = $parsed;
            }
        }

        if (!is_array($data)) {
            return collect();
        }

        return collect($data)->map(function ($info, $code) {
            $name = is_array($info) ? ($info['name'] ?? $code) : $code;
            $count = is_array($info) ? ($info['count'] ?? 0) : 0;
            $price = is_array($info) ? ($info['price'] ?? 0) : 0;

            return new ProductDto(
                code: $code,
                name: $name,
                quantity: (int) $count,
                basePrice: (float) $price,
                baseCurrency: 'USD',
            );
        })->values();
    }

    public function getPrices(string $country, ?string $product = null): Collection
    {
        $params = ['country' => $this->mapCountryCode($country)];
        if ($product) {
            $params['service'] = $this->mapServiceCode($product);
        }

        $result = $this->makeRequest(self::ACTION_GET_PRICES, $params);

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        $data = $result['data'];
        if (is_string($data)) {
            $parsed = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data = $parsed;
            }
        }

        if (!is_array($data)) {
            return collect();
        }

        $prices = collect();

        // GrizzlySMS returns: { country: { service: { cost, count } } }
        foreach ($data as $countryCode => $services) {
            if (!is_array($services)) {
                continue;
            }
            foreach ($services as $serviceCode => $info) {
                if (!is_array($info)) {
                    continue;
                }
                $prices->push(new PriceDto(
                    operator: 'any',
                    cost: $info['cost'] ?? $info['price'] ?? 0,
                    currency: 'USD',
                    available: $info['count'] ?? 0,
                    provider: $this->getIdentifier(),
                ));
            }
        }

        return $prices;
    }

    public function getOperatorPrices(string $country, string $product): Collection
    {
        $params = [
            'country' => $this->mapCountryCode($country),
            'service' => $this->mapServiceCode($product),
        ];

        $result = $this->makeRequest(self::ACTION_GET_PRICES, $params);

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        $data = $result['data'];
        if (is_string($data)) {
            $parsed = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data = $parsed;
            }
        }

        if (!is_array($data)) {
            return collect();
        }

        $prices = collect();
        $countryCode = $this->mapCountryCode($country);
        $serviceCode = $this->mapServiceCode($product);

        // Navigate the response structure
        if (isset($data[$countryCode][$serviceCode])) {
            $info = $data[$countryCode][$serviceCode];
            $prices->push(new PriceDto(
                operator: 'any',
                cost: $info['cost'] ?? $info['price'] ?? 0,
                currency: 'USD',
                available: $info['count'] ?? 0,
                provider: $this->getIdentifier(),
            ));
        } elseif (isset($data['cost']) || isset($data['price'])) {
            // Direct response format
            $prices->push(new PriceDto(
                operator: 'any',
                cost: $data['cost'] ?? $data['price'] ?? 0,
                currency: 'USD',
                available: $data['count'] ?? 0,
                provider: $this->getIdentifier(),
            ));
        }

        return $prices->sortBy('cost')->values();
    }

    public function buyNumber(
        string $country,
        string $operator,
        string $product,
        ?int $userId = null
    ): PurchaseResultDto {
        $params = [
            'service' => $this->mapServiceCode($product),
            'country' => $this->mapCountryCode($country),
        ];

        if ($operator && $operator !== 'any') {
            $params['operator'] = $operator;
        }

        // Use V2 endpoint for JSON response
        $result = $this->makeRequest(self::ACTION_GET_NUMBER_V2, $params, $userId);

        if (!$result['success']) {
            return PurchaseResultDto::failure(
                $this->translateError($result['message'] ?? 'Failed to purchase number')
            );
        }

        $data = $result['data'];

        // Handle V2 JSON response
        if (is_array($data) && isset($data['activationId'])) {
            return PurchaseResultDto::success([
                'order_id' => $data['activationId'],
                'phone' => $data['phoneNumber'],
                'operator' => $operator,
                'product' => $product,
                'price' => $data['activationCost'] ?? null,
                'status' => 'PENDING',
                'country' => $country,
                'expires' => now()->addMinutes(20)->toISOString(),
            ]);
        }

        // Fallback to standard text response: ACCESS_NUMBER:id:phone
        if (is_string($data)) {
            $parsed = $this->parseNumberResponse($data);
            if ($parsed) {
                return PurchaseResultDto::success([
                    'order_id' => $parsed['id'],
                    'phone' => $parsed['phone'],
                    'operator' => $operator,
                    'product' => $product,
                    'price' => null,
                    'status' => 'PENDING',
                    'country' => $country,
                    'expires' => now()->addMinutes(20)->toISOString(),
                ]);
            }
        }

        return PurchaseResultDto::failure('Invalid response from provider');
    }

    public function checkOrder(string $providerOrderId, ?int $userId = null): OrderStatusDto
    {
        $result = $this->makeRequest(self::ACTION_GET_STATUS, [
            'id' => $providerOrderId,
        ], $userId);

        if (!$result['success']) {
            return OrderStatusDto::failure($result['message'] ?? 'Failed to check order');
        }

        $parsed = $this->parseStatusResponse($result['data']);

        return OrderStatusDto::success([
            'order_id' => $providerOrderId,
            'phone' => null,
            'status' => $parsed['status'],
            'sms' => $parsed['sms'] ?? [],
        ], $this->mapStatus($parsed['status']));
    }

    public function finishOrder(string $providerOrderId, ?int $userId = null): bool
    {
        $result = $this->makeRequest(self::ACTION_SET_STATUS, [
            'id' => $providerOrderId,
            'status' => self::SET_STATUS_FINISH,
        ], $userId);

        return $result['success'];
    }

    public function cancelOrder(string $providerOrderId, ?int $userId = null): bool
    {
        $result = $this->makeRequest(self::ACTION_SET_STATUS, [
            'id' => $providerOrderId,
            'status' => self::SET_STATUS_CANCEL,
        ], $userId);

        return $result['success'];
    }

    public function banOrder(string $providerOrderId, ?int $userId = null): bool
    {
        // GrizzlySMS uses cancel for reporting bad numbers
        return $this->cancelOrder($providerOrderId, $userId);
    }

    public function mapStatus(string $providerStatus): string
    {
        // Handle STATUS_OK:{code} format
        if (str_starts_with($providerStatus, 'STATUS_OK')) {
            return 'processing'; // SMS received, waiting for user to finish
        }

        return match ($providerStatus) {
            self::STATUS_WAIT_CODE, self::STATUS_WAIT_RETRY, self::STATUS_WAIT_RESEND => 'processing',
            self::STATUS_CANCEL => 'cancelled',
            default => 'processing',
        };
    }

    /**
     * Service code mappings between internal codes and GrizzlySMS codes
     */
    public function getServiceCodeMapping(): array
    {
        return [
            'whatsapp' => 'wa',
            'telegram' => 'tg',
            'instagram' => 'ig',
            'facebook' => 'fb',
            'twitter' => 'tw',
            'google' => 'go',
            'yahoo' => 'ya',
            'microsoft' => 'mm',
            'amazon' => 'am',
            'uber' => 'ub',
            'paypal' => 'pp',
            'linkedin' => 'oi',
            'discord' => 'ds',
            'tiktok' => 'tk',
            'snapchat' => 'fu',
            'netflix' => 'nf',
            'spotify' => 'sy',
            'viber' => 'vi',
            'wechat' => 'wb',
            'line' => 'me',
            'kakaotalk' => 'kt',
        ];
    }

    /**
     * Country code mappings between internal codes and GrizzlySMS numeric codes
     */
    public function getCountryCodeMapping(): array
    {
        return [
            'russia' => '0',
            'ukraine' => '1',
            'kazakhstan' => '2',
            'china' => '3',
            'philippines' => '4',
            'myanmar' => '5',
            'indonesia' => '6',
            'malaysia' => '7',
            'kenya' => '8',
            'tanzania' => '9',
            'vietnam' => '10',
            'kyrgyzstan' => '11',
            'usa' => '12',
            'israel' => '13',
            'hongkong' => '14',
            'poland' => '15',
            'england' => '16',
            'uk' => '16',
            'madagascar' => '17',
            'dcongo' => '18',
            'nigeria' => '19',
            'macau' => '20',
            'egypt' => '21',
            'india' => '22',
            'ireland' => '23',
            'cambodia' => '24',
            'laos' => '25',
            'haiti' => '26',
            'ivorycoast' => '27',
            'gambia' => '28',
            'serbia' => '29',
            'yemen' => '30',
            'southafrica' => '31',
            'romania' => '32',
            'colombia' => '33',
            'estonia' => '34',
            'azerbaijan' => '35',
            'canada' => '36',
            'morocco' => '37',
            'ghana' => '38',
            'argentina' => '39',
            'uzbekistan' => '40',
            'cameroon' => '41',
            'chad' => '42',
            'germany' => '43',
            'lithuania' => '44',
            'croatia' => '45',
            'sweden' => '46',
            'iraq' => '47',
            'netherlands' => '48',
            'latvia' => '49',
            'austria' => '50',
            'belarus' => '51',
            'thailand' => '52',
            'saudiarabia' => '53',
            'mexico' => '54',
            'taiwan' => '55',
            'spain' => '56',
            'iran' => '57',
            'algeria' => '58',
            'slovenia' => '59',
            'bangladesh' => '60',
            'senegal' => '61',
            'turkey' => '62',
            'czech' => '63',
            'srilanka' => '64',
            'peru' => '65',
            'pakistan' => '66',
            'newzealand' => '67',
            'guinea' => '68',
            'mali' => '69',
            'venezuela' => '70',
            'ethiopia' => '71',
            'mongolia' => '72',
            'brazil' => '73',
            'afghanistan' => '74',
            'uganda' => '75',
            'angola' => '76',
            'cyprus' => '77',
            'france' => '78',
            'papuanewguinea' => '79',
            'mozambique' => '80',
            'nepal' => '81',
            'belgium' => '82',
            'bulgaria' => '83',
            'hungary' => '84',
            'moldova' => '85',
            'italy' => '86',
            'paraguay' => '87',
            'honduras' => '88',
            'tunisia' => '89',
            'nicaragua' => '90',
            'timorleste' => '91',
            'bolivia' => '92',
            'costarica' => '93',
            'guatemala' => '94',
            'uae' => '95',
            'zimbabwe' => '96',
            'puertorico' => '97',
            'sudan' => '98',
            'togo' => '99',
            'kuwait' => '100',
            'salvador' => '101',
            'libya' => '102',
            'jamaica' => '103',
            'trinidad' => '104',
            'ecuador' => '105',
            'swaziland' => '106',
            'oman' => '107',
            'bosnia' => '108',
            'dominican' => '109',
            'qatar' => '111',
            'panama' => '112',
            'mauritania' => '114',
            'sierraleone' => '115',
            'jordan' => '116',
            'portugal' => '117',
            'barbados' => '118',
            'burkinafaso' => '119',
            'lebanon' => '120',
            'zambia' => '121',
            'benin' => '123',
            'reunion' => '125',
            'rwanda' => '128',
            'burundi' => '130',
            'southkorea' => '132',
            'japan' => '133',
        ];
    }

    /**
     * Make request to GrizzlySMS API
     */
    protected function makeRequest(
        string $action,
        array $params = [],
        ?int $userId = null
    ): array {
        $startTime = microtime(true);

        $queryParams = array_merge([
            'api_key' => $this->apiKey,
            'action' => $action,
        ], $params);

        try {
            $response = Http::timeout(5)->connectTimeout(3)->get($this->baseUrl, $queryParams);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);
            $this->logApiCall($action, 'GET', $response->status(), $responseTime, $userId);

            $body = $response->body();

            // Check for error responses
            if ($this->isErrorResponse($body)) {
                return [
                    'success' => false,
                    'message' => $this->translateError($body),
                ];
            }

            // Try to parse as JSON first
            $json = json_decode($body, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
                return ['success' => true, 'data' => $json];
            }

            // Plain text response
            return ['success' => true, 'data' => $body];
        } catch (\Exception $e) {
            $responseTime = (int) ((microtime(true) - $startTime) * 1000);
            $this->logApiCall($action, 'GET', 500, $responseTime, $userId);

            Log::error('GrizzlySMS API exception', [
                'action' => $action,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'message' => 'Service temporarily unavailable'];
        }
    }

    /**
     * Check if response is an error
     */
    protected function isErrorResponse(string $response): bool
    {
        $errors = [
            'BAD_KEY',
            'ERROR_SQL',
            'BAD_ACTION',
            'WRONG_SERVICE',
            'NO_NUMBERS',
            'NO_BALANCE',
            'WRONG_ACTIVATION_ID',
            'BAD_STATUS',
            'NO_ACTIVATION',
            'BANNED',
            'WRONG_COUNTRY',
            'WRONG_OPERATOR',
        ];

        foreach ($errors as $error) {
            if (str_contains($response, $error)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Translate GrizzlySMS error to user-friendly message
     */
    protected function translateError(string $error): string
    {
        return match (true) {
            str_contains($error, 'NO_NUMBERS') => 'No numbers available for this service',
            str_contains($error, 'NO_BALANCE') => 'Provider has insufficient balance',
            str_contains($error, 'WRONG_SERVICE') => 'Invalid service selected',
            str_contains($error, 'WRONG_COUNTRY') => 'Invalid country selected',
            str_contains($error, 'BANNED') => 'Service temporarily unavailable',
            str_contains($error, 'BAD_KEY') => 'Provider configuration error',
            str_contains($error, 'NO_ACTIVATION') => 'Order not found',
            str_contains($error, 'WRONG_ACTIVATION_ID') => 'Invalid order ID',
            default => $error,
        };
    }

    /**
     * Parse ACCESS_BALANCE:123.45 response
     */
    protected function parseBalanceResponse($response): float
    {
        if (is_numeric($response)) {
            return (float) $response;
        }

        if (is_string($response) && preg_match('/ACCESS_BALANCE:([\d.]+)/', $response, $matches)) {
            return (float) $matches[1];
        }

        return 0.0;
    }

    /**
     * Parse ACCESS_NUMBER:id:phone response
     */
    protected function parseNumberResponse(string $response): ?array
    {
        if (preg_match('/ACCESS_NUMBER:(\d+):(\d+)/', $response, $matches)) {
            return [
                'id' => $matches[1],
                'phone' => $matches[2],
            ];
        }

        return null;
    }

    /**
     * Parse STATUS_OK:code or STATUS_WAIT_CODE response
     */
    protected function parseStatusResponse($response): array
    {
        if (is_array($response)) {
            return [
                'status' => $response['status'] ?? 'STATUS_WAIT_CODE',
                'sms' => isset($response['sms']) ? $response['sms'] : [],
            ];
        }

        $responseStr = (string) $response;

        if (preg_match('/STATUS_OK:(.+)/', $responseStr, $matches)) {
            $code = trim($matches[1]);
            return [
                'status' => 'STATUS_OK',
                'sms' => [
                    ['code' => $code, 'text' => "Code: {$code}"]
                ],
            ];
        }

        return [
            'status' => trim($responseStr),
            'sms' => [],
        ];
    }
}
