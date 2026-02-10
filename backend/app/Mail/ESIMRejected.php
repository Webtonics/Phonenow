<?php

namespace App\Mail;

use App\Models\ESIMProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ESIMRejected extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ESIMProfile $profile,
        public string $reason
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'eSIM Order Update - TonicsTools',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.esim-rejected',
            with: [
                'profile' => $this->profile,
                'reason' => $this->reason,
                'refundedAmount' => $this->profile->selling_price,
                'viewUrl' => config('app.frontend_url') . '/esim',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
