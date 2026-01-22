<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'balance',
        'api_key',
        'is_active',
        'email_verified',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'api_key',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'decimal:2',
            'is_active' => 'boolean',
            'email_verified' => 'boolean',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function emailVerifications(): HasMany
    {
        return $this->hasMany(EmailVerification::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isReseller(): bool
    {
        return $this->role === 'reseller';
    }

    public function hasBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    public function deductBalance(float $amount): bool
    {
        if (!$this->hasBalance($amount)) {
            return false;
        }
        $this->balance -= $amount;
        $this->save();
        return true;
    }

    public function addBalance(float $amount): void
    {
        $this->balance += $amount;
        $this->save();
    }
}
