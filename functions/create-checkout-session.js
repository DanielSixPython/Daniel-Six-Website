// functions/create-checkout-session.js
import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    try {
        let cart;
        try {
            const body = await request.json();
            cart = body.cart;
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON in request" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return new Response(JSON.stringify({ error: "Cart is empty" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!env.STRIPE_SECRET_KEY) {
            return new Response(JSON.stringify({ error: "Stripe key not configured on Cloudflare" }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            httpClient: Stripe.createFetchHttpClient()
        });

        const lineItems = cart.map(item => ({
            price: item.priceId,
            quantity: parseInt(item.qty) || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/cart.html`,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Checkout error:", error);
        return new Response(JSON.stringify({ 
            error: error.message || "Internal server error" 
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
