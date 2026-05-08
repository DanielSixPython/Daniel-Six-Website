import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        // Ensure the secret key exists
        if (!env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not defined in environment variables.");
        }

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
            shipping_options: [
                {
                    shipping_rate: 'shr_1TUdFECkSiGjt6yMZniIyG4X', 
                },
            ],
            line_items: cart.map(item => ({
                price: item.priceId,
                quantity: parseInt(item.qty) || 1,
            })),
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        // CRITICAL FIX: You must return the session URL to the frontend
        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });
        
    } catch (error) {
        // Return a JSON error instead of an HTML error
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
