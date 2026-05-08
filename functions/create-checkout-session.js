import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        const body = await request.json();
        const { cart } = body;

const session = await stripe.checkout.sessions.create({
    submit_type: 'pay',
    billing_address_collection: 'auto',
    shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
    },
    // Add this section here:
    shipping_options: [
      {
        shipping_rate: 'shr_1TUdFECkSiGjt6yMZniIyG4X', 
      },
    ],
    line_items: cart.map(item => ({
        price: item.priceId,
        quantity: item.qty,
    })),
    mode: 'payment',
    success_url: `${new URL(request.url).origin}/success.html`,
    cancel_url: `${new URL(request.url).origin}/cart.html`,
});
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
