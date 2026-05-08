import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        if (!env.STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "API Key Missing" }), { status: 500 });
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        const body = await request.json();
        const { cart } = body;

        const session = await stripe.checkout.sessions.create({
            submit_type: 'pay', // Makes the button say "Pay" instead of just "Donate" or nothing
            billing_address_collection: 'auto',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA'], // Add countries you want to ship to
            },
            line_items: cart.map(item => ({
                price: item.priceId,
                quantity: parseInt(item.qty) || 1,
                // This allows the user to change quantities on the Stripe page
                adjustable_quantity: {
                    enabled: true,
                    minimum: 1,
                    maximum: 99,
                },
            })),
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
