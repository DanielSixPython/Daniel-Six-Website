import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

export async function onRequestPost({ request, env }) {
    try {
        if (!env.STRIPE_SECRET_KEY) {
            return new Response("API Key Missing in Settings", { status: 500 });
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        const { cart } = await request.json();

        const session = await stripe.checkout.sessions.create({
            line_items: cart.map(item => ({
                price: item.priceId,
                quantity: parseInt(item.qty) || 1,
            })),
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
