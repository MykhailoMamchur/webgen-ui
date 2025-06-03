"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import UpgradeSuccessBanner from "./upgrade-success-banner"

interface UpgradeSuccessHandlerProps {
  onUpgradeSuccess: (show: boolean) => void
}

export default function UpgradeSuccessHandler({ onUpgradeSuccess }: UpgradeSuccessHandlerProps) {
  const searchParams = useSearchParams()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const upgradeSuccess = searchParams.get("upgrade_success")
    const paymentSuccess = searchParams.get("payment_success")

    if (upgradeSuccess === "true" || paymentSuccess === "true") {
      setShowBanner(true)
      onUpgradeSuccess(true)

      // Clean up the URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("upgrade_success")
      newUrl.searchParams.delete("payment_success")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams, onUpgradeSuccess])

  const handleDismiss = () => {
    setShowBanner(false)
    onUpgradeSuccess(false)
  }

  if (!showBanner) return null

  return <UpgradeSuccessBanner onDismiss={handleDismiss} />
}
