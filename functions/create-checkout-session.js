// functions/create-checkout-session.js
import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        const { cart } = await request.json();

        if (!cart || !Array.isArray(cart)) {
            return new Response(JSON.stringify({ error: "Invalid cart" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient()   // Important for Cloudflare
        });

        const lineItems = cart.map(item => ({
            price: item.priceId,
            quantity: item.qty,
        }));

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
            
            // Optional improvements
            // shipping_address_collection: { allowed_countries: ['US'] },
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ 
            error: "Failed to create checkout session" 
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
