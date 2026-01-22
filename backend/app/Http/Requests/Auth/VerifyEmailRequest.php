<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'size:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.size' => 'Invalid verification token.',
        ];
    }
}
