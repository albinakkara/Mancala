import React from 'react';
import type { Player } from '../lib/types';

export interface CaptureSeed {
    id: number;
    fromPit: number;
    toStore: number;
    startX: number;
    startY: number;
    deltaX: number;
    deltaY: number;
    delay: number;
    player: Player;
}

export interface CaptureAnimState {
    active: boolean;
    seeds: CaptureSeed[];
    fromPits: number[];
    toStore: number;
    player: Player;
}

interface AnimatedSeedClusterProps {
    clusterVisible: boolean;
    clusterPos: { x: number; y: number };
    clusterSeedCount: number;
    clusterAnimClass: string;
    captureAnim: CaptureAnimState;
}

export const AnimatedSeedCluster: React.FC<AnimatedSeedClusterProps> = ({
    clusterVisible,
    clusterPos,
    clusterSeedCount,
    clusterAnimClass,
    captureAnim,
}) => {
    const renderSeedCluster = () => {
        if (!clusterVisible) return null;
        return (
            <div
                className={`absolute pointer-events-none z-40 ${clusterAnimClass}`}
                style={{
                    left: clusterPos.x,
                    top: clusterPos.y,
                    width: 44,
                    height: 44,
                    transform: 'translate(-50%,-50%)',
                    transition:
                        'left 0.3s cubic-bezier(0.2,0,0,1), top 0.3s cubic-bezier(0.2,0,0,1)',
                }}
            >
                <div className="absolute inset-1 flex items-center justify-center flex-wrap gap-px p-0.5">
                    {Array.from({ length: Math.min(clusterSeedCount, 12) }).map((_, i) => (
                        <span
                            key={i}
                            className="rounded-full"
                            style={{ width: 10, height: 10, backgroundColor: '#171717' }}
                        />
                    ))}
                    {clusterSeedCount > 12 && (
                        <span className="absolute -top-0.5 -right-0.5 text-[7px] font-bold text-white font-mono-code bg-black rounded-full px-0.5 leading-none">
                            +{clusterSeedCount - 12}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const renderCaptureFlyingSeeds = () => {
        if (!captureAnim.active || captureAnim.seeds.length === 0) return null;
        return (
            <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
                {captureAnim.seeds.map((seed) => (
                    <span
                        key={seed.id}
                        data-capture-seed={seed.id}
                        className="absolute rounded-full"
                        style={{
                            width: 10,
                            height: 10,
                            backgroundColor: '#171717',
                            left: seed.startX,
                            top: seed.startY,
                            transform: 'translate(-50%,-50%)',
                            opacity: 1,
                            zIndex: 40,
                        }}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            {renderSeedCluster()}
            {renderCaptureFlyingSeeds()}
        </>
    );
};

