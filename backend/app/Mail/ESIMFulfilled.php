<?php

namespace App\Mail;

use App\Models\ESIMProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ESIMFulfilled extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ESIMProfile $profile
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your eSIM for {$this->profile->country_name} is Ready! - TonicsTools",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.esim-fulfilled',
            with: [
                'profile' => $this->profile,
                'lpaString' => $this->profile->lpa_string,
                'qrCodeUrl' => $this->profile->qr_code_url,
                'viewUrl' => config('app.frontend_url') . '/esim/my-profiles',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
