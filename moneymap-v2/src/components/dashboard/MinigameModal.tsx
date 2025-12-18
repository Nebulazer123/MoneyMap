"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { X, Coins, Trophy, Play, Heart, Zap, Bomb } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinigameModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type GameState = "idle" | "playing" | "gameOver";
type CoinType = "bronze" | "silver" | "gold" | "bomb" | "multiplier" | "life";

interface Coin {
    id: string;
    x: number;
    y: number;
    type: CoinType;
    velocity: number;
    createdAt: number;
    rotation: number;
}

const COIN_VALUES = {
    bronze: 1,
    silver: 5,
    gold: 10,
    bomb: 0,
    multiplier: 0,
    life: 0,
};

const COIN_COLORS = {
    bronze: "from-amber-600 to-amber-800",
    silver: "from-zinc-300 to-zinc-500",
    gold: "from-yellow-400 to-yellow-600",
    bomb: "from-red-600 to-red-800",
    multiplier: "from-purple-500 to-purple-700",
    life: "from-emerald-500 to-emerald-700",
};

const COIN_SPEEDS = {
    bronze: 1.2,
    silver: 1.6,
    gold: 2.1,
    bomb: 1.4,
    multiplier: 1.5,
    life: 1.1,
};

const INITIAL_LIVES = 3;
const BASE_SPAWN_INTERVAL = 800;
const MIN_SPAWN_INTERVAL = 250;
const GRAVITY = 0.5;
const GAME_AREA_HEIGHT = 384; // h-96 = 384px
const COIN_SIZE = 56;
const HIGH_SCORE_KEY = "minigame-highscore";
const ANIMATION_FPS = 60;
const FRAME_TIME = 1000 / ANIMATION_FPS;

export function MinigameModal({ isOpen, onClose }: MinigameModalProps) {
    const [gameState, setGameState] = useState<GameState>("idle");
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [highScore, setHighScore] = useState(0);
    const [coins, setCoins] = useState<Coin[]>([]);
    const [spawnRate, setSpawnRate] = useState(BASE_SPAWN_INTERVAL);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [comboBreakAnimation, setComboBreakAnimation] = useState(false);
    const [screenShake, setScreenShake] = useState(false);
    const [multiplierActive, setMultiplierActive] = useState(false);
    const [multiplierCountdown, setMultiplierCountdown] = useState(0);
    const [explosions, setExplosions] = useState<Array<{ x: number; y: number; id: string }>>([]);
    
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const coinSpawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastFrameTimeRef = useRef<number>(0);

    // Load high score from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(HIGH_SCORE_KEY);
            if (saved) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setHighScore(parseInt(saved, 10));
            }
        }
    }, []);

    // Calculate combo multiplier
    const getComboMultiplier = useCallback((comboCount: number) => {
        if (comboCount < 5) return 1;
        if (comboCount < 10) return 2;
        if (comboCount < 20) return 3;
        if (comboCount < 30) return 4;
        return 5;
    }, []);

    // Calculate dynamic spawn rate based on score
    const calculateSpawnRate = useCallback((currentScore: number) => {
        const newRate = BASE_SPAWN_INTERVAL - (currentScore / 80) * 60;
        return Math.max(MIN_SPAWN_INTERVAL, newRate);
    }, []);

    // Calculate base fall speed based on score
    const getBaseSpeed = useCallback((currentScore: number) => {
        const speedMultiplier = 1.5 + (currentScore / 150);
        return speedMultiplier;
    }, []);

    const spawnCoin = useCallback(() => {
        if (!gameAreaRef.current || gameState !== "playing") return;

        const area = gameAreaRef.current;
        const areaRect = area.getBoundingClientRect();
        const padding = 20;

        // Random X position within game area
        const x = Math.random() * (areaRect.width - COIN_SIZE - padding * 2) + padding;
        const y = -COIN_SIZE; // Start above screen

        // Random coin type (weighted distribution)
        const rand = Math.random();
        let type: CoinType;
        if (rand < 0.5) {
            type = "bronze";
        } else if (rand < 0.8) {
            type = "silver";
        } else if (rand < 0.92) {
            type = "gold";
        } else if (rand < 0.96) {
            type = "bomb";
        } else if (rand < 0.98) {
            type = "multiplier";
        } else {
            type = "life";
        }

        const baseSpeed = getBaseSpeed(score);
        const speed = COIN_SPEEDS[type] * baseSpeed;

        const newCoin: Coin = {
            id: `coin-${Date.now()}-${Math.random()}`,
            x,
            y,
            type,
            velocity: speed,
            createdAt: Date.now(),
            rotation: Math.random() * 360,
        };

        setCoins((prev) => [...prev, newCoin]);
    }, [gameState, score, getBaseSpeed]);

    const checkCollision = useCallback((coin: Coin, clickX: number, clickY: number) => {
        const coinCenterX = coin.x + COIN_SIZE / 2;
        const coinCenterY = coin.y + COIN_SIZE / 2;
        const distance = Math.sqrt(
            Math.pow(clickX - coinCenterX, 2) + Math.pow(clickY - coinCenterY, 2)
        );
        return distance < COIN_SIZE / 2;
    }, []);

    const handleCoinClick = useCallback((clickX: number, clickY: number) => {
        // Find the coin that was clicked
        const clickedCoin = coins.find((coin) => checkCollision(coin, clickX, clickY));
        if (!clickedCoin) return;

        const coin = clickedCoin;

        // Handle special coins
        if (coin.type === "bomb") {
            // Explode and clear nearby coins
            const explosionRadius = 100;
            setExplosions((prev) => [...prev, { x: coin.x, y: coin.y, id: `explosion-${Date.now()}` }]);
            
            setCoins((prev) => {
                return prev.filter((c) => {
                    if (c.id === coin.id) return false;
                    const distance = Math.sqrt(
                        Math.pow(c.x - coin.x, 2) + Math.pow(c.y - coin.y, 2)
                    );
                    return distance > explosionRadius;
                });
            });
            return;
        }

        if (coin.type === "multiplier") {
            setMultiplierActive(true);
            setMultiplierCountdown(10);
            setCoins((prev) => prev.filter((c) => c.id !== coin.id));
            return;
        }

        if (coin.type === "life") {
            setLives((prev) => Math.min(INITIAL_LIVES, prev + 1));
            setCoins((prev) => prev.filter((c) => c.id !== coin.id));
            return;
        }

        // Regular coin collection
        const baseMultiplier = multiplierActive ? 2 : getComboMultiplier(combo);
        const points = COIN_VALUES[coin.type] * baseMultiplier;
        
        setScore((prev) => {
            const newScore = prev + points;
            setSpawnRate(calculateSpawnRate(newScore));
            return newScore;
        });

        // Increment combo
        setCombo((prev) => {
            const newCombo = prev + 1;
            if (newCombo > maxCombo) {
                setMaxCombo(newCombo);
            }
            if (newCombo === 10 || newCombo === 20 || newCombo === 30) {
                setScreenShake(true);
                setTimeout(() => setScreenShake(false), 300);
            }
            return newCombo;
        });

        // Handle multiplier countdown
        if (multiplierActive) {
            setMultiplierCountdown((prev) => {
                const newCount = prev - 1;
                if (newCount <= 0) {
                    setMultiplierActive(false);
                }
                return newCount;
            });
        }

        setCoins((prev) => prev.filter((c) => c.id !== coin.id));
    }, [coins, combo, maxCombo, getComboMultiplier, calculateSpawnRate, multiplierActive, checkCollision]);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const loseLife = useCallback(() => {
        setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                endGame();
                return 0;
            }
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 300);
            return newLives;
        });
        
        if (combo > 0) {
            setComboBreakAnimation(true);
            setTimeout(() => setComboBreakAnimation(false), 500);
        }
        setCombo(0);
    }, [combo]);

    // Animation loop for falling coins
    useEffect(() => {
        if (gameState !== "playing") return;

        const animate = (currentTime: number) => {
            const deltaTime = currentTime - lastFrameTimeRef.current;
            
            if (deltaTime >= FRAME_TIME) {
                setCoins((prev) => {
                    const baseSpeed = getBaseSpeed(score);
                    return prev.map((coin) => {
                        const newY = coin.y + (coin.velocity * GRAVITY * baseSpeed * (deltaTime / 16));
                        const newRotation = coin.rotation + (deltaTime * 0.1);

                        // Check if coin hit bottom
                        if (newY > GAME_AREA_HEIGHT) {
                            loseLife();
                            return null;
                        }

                        return {
                            ...coin,
                            y: newY,
                            rotation: newRotation,
                        };
                    }).filter((coin): coin is Coin => coin !== null);
                });

                lastFrameTimeRef.current = currentTime;
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameState, score, getBaseSpeed, loseLife]);

    // Coin spawning
    useEffect(() => {
        if (gameState === "playing") {
            if (coinSpawnIntervalRef.current) {
                clearInterval(coinSpawnIntervalRef.current);
            }
            
            coinSpawnIntervalRef.current = setInterval(() => {
                spawnCoin();
            }, spawnRate);
        }

        return () => {
            if (coinSpawnIntervalRef.current) {
                clearInterval(coinSpawnIntervalRef.current);
            }
        };
    }, [gameState, spawnRate, spawnCoin]);

    // Cleanup explosions
    useEffect(() => {
        if (explosions.length > 0) {
            const timer = setTimeout(() => {
                setExplosions((prev) => prev.slice(1));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [explosions]);

    const startGame = useCallback(() => {
        setGameState("playing");
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setLives(INITIAL_LIVES);
        setCoins([]);
        setSpawnRate(BASE_SPAWN_INTERVAL);
        setIsNewHighScore(false);
        setComboBreakAnimation(false);
        setScreenShake(false);
        setMultiplierActive(false);
        setMultiplierCountdown(0);
        setExplosions([]);
        lastFrameTimeRef.current = performance.now();
    }, []);

    const endGame = useCallback(() => {
        setGameState("gameOver");
        
        if (score > highScore) {
            setIsNewHighScore(true);
            setHighScore(score);
            if (typeof window !== "undefined") {
                localStorage.setItem(HIGH_SCORE_KEY, score.toString());
            }
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (coinSpawnIntervalRef.current) {
            clearInterval(coinSpawnIntervalRef.current);
        }
    }, [score, highScore]);

    // Cleanup on unmount or close
    useEffect(() => {
        if (!isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setGameState("idle");
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setScore(0);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCombo(0);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMaxCombo(0);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLives(INITIAL_LIVES);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCoins([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSpawnRate(BASE_SPAWN_INTERVAL);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsNewHighScore(false);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setComboBreakAnimation(false);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setScreenShake(false);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMultiplierActive(false);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMultiplierCountdown(0);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setExplosions([]);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (coinSpawnIntervalRef.current) {
                clearInterval(coinSpawnIntervalRef.current);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const multiplier = multiplierActive ? 2 : getComboMultiplier(combo);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <GlassCard
                className={cn(
                    "w-full max-w-2xl relative animate-in fade-in zoom-in-95 duration-200",
                    screenShake && "animate-[shake_0.3s_ease-in-out]"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Coins className="h-6 w-6 text-yellow-400" />
                            Coin Shooter - Endless Mode
                        </h2>
                        <p className="text-zinc-400 text-sm">
                            Click falling coins before they hit the bottom! Build combos for multipliers.
                        </p>
                    </div>

                    {/* Game Stats */}
                    {gameState !== "idle" && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {/* Score */}
                            <div className="px-4 py-3 rounded-xl bg-zinc-900/40 border border-white/10">
                                <p className="text-xs text-zinc-500 mb-1">Score</p>
                                <p className="text-2xl font-bold text-white tabular-nums">{score}</p>
                            </div>

                            {/* Combo */}
                            <div className="px-4 py-3 rounded-xl bg-zinc-900/40 border border-white/10">
                                <p className="text-xs text-zinc-500 mb-1">Combo</p>
                                <div className="flex items-baseline gap-2">
                                    <p className={cn(
                                        "text-2xl font-bold tabular-nums transition-all",
                                        combo > 0 ? "text-purple-400" : "text-zinc-400"
                                    )}>
                                        {combo}
                                    </p>
                                    {multiplier > 1 && (
                                        <span className={cn(
                                            "text-sm font-bold",
                                            multiplierActive ? "text-purple-400" : "text-yellow-400"
                                        )}>
                                            {multiplier}x
                                        </span>
                                    )}
                                </div>
                                {multiplierActive && (
                                    <p className="text-[10px] text-purple-400 mt-1">
                                        {multiplierCountdown} left
                                    </p>
                                )}
                            </div>

                            {/* Lives */}
                            <div className="px-4 py-3 rounded-xl bg-zinc-900/40 border border-white/10">
                                <p className="text-xs text-zinc-500 mb-1">Lives</p>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                        <Heart
                                            key={i}
                                            className={cn(
                                                "h-5 w-5 transition-all",
                                                i < lives
                                                    ? "text-red-400 fill-red-400"
                                                    : "text-zinc-600 fill-zinc-600"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* High Score */}
                            <div className="px-4 py-3 rounded-xl bg-zinc-900/40 border border-white/10">
                                <p className="text-xs text-zinc-500 mb-1">High Score</p>
                                <p className="text-2xl font-bold text-yellow-400 tabular-nums">{highScore}</p>
                            </div>
                        </div>
                    )}

                    {/* Combo Break Animation */}
                    {comboBreakAnimation && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                            <div className="text-4xl font-bold text-red-400 animate-[fadeOut_0.5s_ease-out]">
                                COMBO BROKEN!
                            </div>
                        </div>
                    )}

                    {/* Game Area */}
                    <div
                        ref={gameAreaRef}
                        className={cn(
                            "relative w-full h-96 rounded-xl border-2 border-dashed overflow-hidden transition-all",
                            gameState === "playing"
                                ? "border-purple-500/50 bg-gradient-to-br from-purple-950/20 to-zinc-900/40"
                                : "border-zinc-700 bg-zinc-900/30"
                        )}
                        onClick={(e) => {
                            if (gameState === "playing" && gameAreaRef.current) {
                                const rect = gameAreaRef.current.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const clickY = e.clientY - rect.top;
                                
                                handleCoinClick(clickX, clickY);
                            }
                        }}
                    >
                        {/* Explosions */}
                        {explosions.map((explosion) => (
                            <div
                                key={explosion.id}
                                className="absolute pointer-events-none z-50"
                                style={{
                                    left: `${explosion.x}px`,
                                    top: `${explosion.y}px`,
                                }}
                            >
                                <div className="w-24 h-24 rounded-full bg-red-500/50 animate-[explode_0.5s_ease-out] border-4 border-red-400" />
                            </div>
                        ))}

                        {/* Idle State */}
                        {gameState === "idle" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                                    <Coins className="h-10 w-10 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="text-zinc-400 text-sm mb-2">Shoot falling coins!</p>
                                    {highScore > 0 && (
                                        <p className="text-xs text-zinc-500">High Score: <span className="text-yellow-400 font-bold">{highScore}</span></p>
                                    )}
                                </div>
                                <Button
                                    onClick={startGame}
                                    className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
                                >
                                    <Play className="h-4 w-4" />
                                    Start Game
                                </Button>
                            </div>
                        )}

                        {/* Playing State - Falling Coins */}
                        {gameState === "playing" && (
                            <>
                                {coins.map((coin) => (
                                    <FallingCoinElement
                                        key={coin.id}
                                        coin={coin}
                                        multiplier={multiplier}
                                    />
                                ))}
                            </>
                        )}

                        {/* Game Over State */}
                        {gameState === "gameOver" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/90 backdrop-blur-sm">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                                    <Trophy className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-white">Game Over!</h3>
                                
                                {isNewHighScore && (
                                    <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                                        <p className="text-yellow-400 font-bold text-sm">🎉 NEW HIGH SCORE! 🎉</p>
                                    </div>
                                )}
                                
                                <div className="space-y-2 text-center">
                                    <p className="text-zinc-400">
                                        Final Score: <span className="text-white font-bold text-2xl">{score}</span>
                                    </p>
                                    <p className="text-zinc-400">
                                        Max Combo: <span className="text-purple-400 font-bold text-xl">{maxCombo}</span>
                                    </p>
                                    {highScore > 0 && score < highScore && (
                                        <p className="text-xs text-zinc-500">
                                            High Score: <span className="text-yellow-400">{highScore}</span>
                                        </p>
                                    )}
                                </div>
                                
                                <div className="flex gap-3 mt-2">
                                    <Button
                                        onClick={startGame}
                                        className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
                                    >
                                        <Play className="h-4 w-4" />
                                        Play Again
                                    </Button>
                                    <Button
                                        onClick={onClose}
                                        variant="ghost"
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

interface FallingCoinElementProps {
    coin: Coin;
    multiplier: number;
}

function FallingCoinElement({ coin, multiplier }: FallingCoinElementProps) {
    const urgency = coin.y > GAME_AREA_HEIGHT * 0.7;
    const isSpecial = coin.type === "bomb" || coin.type === "multiplier" || coin.type === "life";

    return (
        <div
            className={cn(
                "absolute transition-all duration-100 cursor-pointer pointer-events-none",
                urgency && "animate-pulse"
            )}
            style={{
                left: `${coin.x}px`,
                top: `${coin.y}px`,
                transform: `rotate(${coin.rotation}deg)`,
            }}
        >
            <div
                className={cn(
                    "h-14 w-14 rounded-full bg-gradient-to-br shadow-lg transition-all duration-200",
                    COIN_COLORS[coin.type],
                    isSpecial && "ring-2 ring-white/50",
                    coin.type === "bomb" && "ring-red-500/50",
                    coin.type === "multiplier" && "ring-purple-500/50",
                    coin.type === "life" && "ring-emerald-500/50"
                )}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    {coin.type === "bomb" ? (
                        <Bomb className="h-6 w-6 text-white" />
                    ) : coin.type === "multiplier" ? (
                        <Zap className="h-6 w-6 text-white" />
                    ) : coin.type === "life" ? (
                        <Heart className="h-6 w-6 text-white fill-white" />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Coins className="h-5 w-5 text-white/80" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
