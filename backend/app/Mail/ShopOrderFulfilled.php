<?php

namespace App\Mail;

use App\Models\ShopOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShopOrderFulfilled extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ShopOrder $order
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your {$this->order->product->name} activation code is ready! - TonicsTools",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shop-order-fulfilled',
            with: [
                'order' => $this->order,
                'product' => $this->order->product,
                'user' => $this->order->user,
                'viewUrl' => config('app.frontend_url') . '/shop',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
