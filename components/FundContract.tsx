"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAccount, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { TOKEN_ABI, VESTOLINK_ABI } from '@/lib/web3'
import { Coins, Upload, ExternalLink } from "lucide-react"

interface FundContractProps {
  tokenAddress: string
  vestingAddress: string
  tokenSymbol: string
  requiredAmount: string
  currentBalance: string
}

export default function FundContract({ 
  tokenAddress, 
  vestingAddress, 
  tokenSymbol, 
  requiredAmount, 
  currentBalance 
}: FundContractProps) {
  const { address: account } = useAccount()
  const { writeContract } = useWriteContract()
  const [amount, setAmount] = useState('')
  const [funding, setFunding] = useState(false)
  const [approving, setApproving] = useState(false)

  const handleApprove = async () => {
    if (!account || !amount) {
      alert('Please enter an amount to approve')
      return
    }

    if (Number(amount) <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    setApproving(true)
    try {
      // Approve the vesting contract to spend tokens on behalf of the admin
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [vestingAddress as `0x${string}`, parseEther(amount)]
      })
      alert('Token approval submitted! Please wait for confirmation before proceeding to step 2.')
    } catch (error: any) {
      console.error('Approve error:', error)
      alert(`Approval failed: ${error.message}`)
    } finally {
      setApproving(false)
    }
  }

  const handleTransfer = async () => {
    if (!account || !amount) {
      alert('Please enter an amount to deposit')
      return
    }

    if (Number(amount) <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    const amountNum = Number(amount)
    if (amountNum < shortfall) {
      const confirm = window.confirm(`You're depositing ${amountNum} tokens but the shortfall is ${shortfall.toFixed(2)} tokens. Continue anyway?`)
      if (!confirm) return
    }

    setFunding(true)
    try {
      // Call the depositTokens function on the vesting contract
      await writeContract({
        address: vestingAddress as `0x${string}`,
        abi: VESTOLINK_ABI,
        functionName: 'depositTokens',
        args: [parseEther(amount)]
      })
      alert('Token deposit submitted! Please wait for confirmation. The page will refresh automatically.')
      setTimeout(() => window.location.reload(), 5000)
    } catch (error: any) {
      console.error('Deposit error:', error)
      
      let errorMessage = 'Deposit failed'
      if (error.message?.includes('insufficient allowance')) {
        errorMessage = 'Insufficient allowance. Please complete Step 1 (Approve) first.'
      } else if (error.message?.includes('insufficient balance')) {
        errorMessage = 'Insufficient token balance in your wallet.'
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage
      } else if (error.reason) {
        errorMessage = error.reason
      }
      
      alert(`${errorMessage}\n\nMake sure you:\n• Have enough tokens in your wallet\n• Completed Step 1 (Approve) first\n• Have sufficient gas for the transaction`)
    } finally {
      setFunding(false)
    }
  }

  const shortfall = Number(requiredAmount) - Number(currentBalance)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 bg-red-900/20 rounded-2xl border border-red-500/30"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
          <Upload className="w-4 h-4 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-red-400">Fund Contract</h3>
      </div>

      <div className="space-y-4 mb-6">
        <div className="p-3 bg-slate-800/50 rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Required Balance:</span>
            <span className="text-white">{Number(requiredAmount).toFixed(2)} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Current Balance:</span>
            <span className="text-white">{Number(currentBalance).toFixed(2)} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Shortfall:</span>
            <span className="text-red-400 font-semibold">{shortfall.toFixed(2)} {tokenSymbol}</span>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
            Amount to Fund
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Minimum: ${shortfall.toFixed(2)}`}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleApprove}
          disabled={!amount || approving}
          className="w-full py-3 bg-yellow-500 text-slate-900 rounded-xl font-semibold hover:bg-yellow-400 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {approving ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Approving...</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              <span>1. Approve Tokens</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTransfer}
          disabled={!amount || funding}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {funding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Depositing...</span>
            </>
          ) : (
            <>
              <Coins className="w-4 h-4" />
              <span>2. Deposit Tokens</span>
            </>
          )}
        </motion.button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Step 1: Approve the vesting contract to spend your tokens<br/>
        Step 2: Deposit tokens into the vesting contract
      </p>
    </motion.div>
  )
}
