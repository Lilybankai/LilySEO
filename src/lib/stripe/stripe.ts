import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
  typescript: true,
})

export const getStripeCustomer = async (customerId: string) => {
  return stripe.customers.retrieve(customerId)
}

export const createStripeCustomer = async (email: string, name?: string) => {
  return stripe.customers.create({
    email,
    name,
  })
}

export const createStripeCheckoutSession = async (
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) => {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}

export const createStripePortalSession = async (
  customerId: string,
  returnUrl: string
) => {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export const getSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.retrieve(subscriptionId)
}

export const cancelSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.cancel(subscriptionId)
}

export const updateSubscription = async (
  subscriptionId: string,
  priceId: string
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const subscriptionItemId = subscription.items.data[0].id

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscriptionItemId,
        price: priceId,
      },
    ],
  })
} 