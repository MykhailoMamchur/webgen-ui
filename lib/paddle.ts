import { PADDLE_ENVIRONMENT, PADDLE_CLIENT_TOKEN, PADDLE_SUBSCRIPTION_PRICE_ID, PADDLE_SUCCESS_URL } from "./config"

declare global {
  interface Window {
    Paddle: any
  }
}

interface PaddleCheckoutOptions {
  email: string
  userId: string
}

export const openPaddleCheckout = async ({ email, userId }: PaddleCheckoutOptions): Promise<void> => {
  try {
    // Load Paddle script if not already loaded
    if (!window.Paddle) {
      await loadPaddleScript()
    }

    // Initialize Paddle if not already initialized
    if (!window.Paddle.Environment) {
      window.Paddle.Environment.set(PADDLE_ENVIRONMENT)
      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
      })
    }

    // Define the items for checkout
    const itemsList = [
      {
        priceId: PADDLE_SUBSCRIPTION_PRICE_ID,
        quantity: 1,
      },
    ]

    // Open the checkout
    window.Paddle.Checkout.open({
      settings: {
        displayMode: "overlay",
        variant: "one-page",
        theme: "dark",
        successUrl: PADDLE_SUCCESS_URL,
        showAddDiscounts: false
      },
      items: itemsList,
      customer: {
        email: email,
      },
      customData: {
        user_id: userId,
      },
    })
  } catch (error) {
    console.error("Error opening Paddle checkout:", error)
    // Fallback to external pricing page
    window.open("https://usemanufactura.com/pricing", "_blank")
  }
}

const loadPaddleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="paddle.js"]')) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Paddle script"))
    document.head.appendChild(script)
  })
}
