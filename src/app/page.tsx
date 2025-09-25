"use client";

import MintingSection from "@/components/MintingSection";
import WalletProvider from "@/components/WalletProvider";
import WalletConnection from "@/components/WalletConnection";

export default function Home() {
  return (
    <WalletProvider>
      <main 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://i.imgur.com/2boXIwR.jpeg')"
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 z-0"
            style={{
              backgroundImage: 'url("https://i.imgur.com/2boXIwR.jpeg")'
            }}
          ></div>
          
          {/* Animated Cloud Background - Overlayed on top */}
          <div className="absolute inset-0 overflow-hidden z-30">
            <div className="absolute top-10 w-64 h-32 bg-white/70 rounded-full blur-xl animate-[slide_8s_linear_infinite] [animation-delay:0s] hover:animate-pulse" style={{left: '-256px'}}></div>
            <div className="absolute top-32 w-48 h-24 bg-white/80 rounded-full blur-lg animate-[slide_12s_linear_infinite] [animation-delay:2s] hover:animate-pulse" style={{left: '-192px'}}></div>
            <div className="absolute top-64 w-80 h-40 bg-white/65 rounded-full blur-2xl animate-[slide_15s_linear_infinite] [animation-delay:4s] hover:animate-pulse" style={{left: '-320px'}}></div>
            <div className="absolute bottom-32 w-56 h-28 bg-white/75 rounded-full blur-xl animate-[slide_10s_linear_infinite] [animation-delay:1s] hover:animate-pulse" style={{left: '-224px'}}></div>
            <div className="absolute bottom-64 w-72 h-36 bg-white/70 rounded-full blur-lg animate-[slide_14s_linear_infinite] [animation-delay:3s] hover:animate-pulse" style={{left: '-288px'}}></div>
            <div className="absolute top-1/2 w-40 h-20 bg-white/75 rounded-full blur-xl animate-[slide_9s_linear_infinite] [animation-delay:5s] hover:animate-pulse" style={{left: '-160px'}}></div>
            <div className="absolute top-20 w-60 h-30 bg-white/68 rounded-full blur-2xl animate-[slide_11s_linear_infinite] [animation-delay:6s] hover:animate-pulse" style={{left: '-240px'}}></div>
            <div className="absolute bottom-20 w-44 h-22 bg-white/72 rounded-full blur-lg animate-[slide_13s_linear_infinite] [animation-delay:7s] hover:animate-pulse" style={{left: '-176px'}}></div>
          </div>
          
          {/* Header with Wallet Connection */}
          <div className="relative z-40 p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div className="text-white">
                <h1 className="text-2xl font-bold">KUUSOU Cloud Gang</h1>
                <p className="text-sm text-white/70">Solana NFT Collection</p>
              </div>
              <WalletConnection />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="relative z-40">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center mb-12 relative">
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-teal-500/15 to-emerald-500/15 blur-2xl rounded-full transform scale-110"></div>
                
                {/* Main header container - even smaller and sleeker */}
                <div className="relative bg-white/8 backdrop-blur-lg border border-white/15 rounded-xl p-4 md:p-6 shadow-xl max-w-3xl mx-auto">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-widest mb-3 bg-gradient-to-r from-white/90 via-cyan-200/80 to-white/90 bg-clip-text text-transparent leading-tight backdrop-blur-sm border border-white/10 rounded-lg px-6 py-3 bg-white/5 animate-pulse [animation-duration:3s] hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20">
                    $KUUSOU Cloud Gang NFT
                  </h1>
                  
                  <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 mx-auto mb-3 rounded-full"></div>
                  
                  <p className="text-base md:text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
                    A collection of <span className="text-cyan-300 font-semibold">111</span> Cloud Gang profile picture NFTs
                  </p>
                </div>
              </div>
              
              <MintingSection />
            </div>
          </div>
        </div>
      </main>
    </WalletProvider>
  );
}