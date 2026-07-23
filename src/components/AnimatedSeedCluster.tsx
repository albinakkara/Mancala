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
        if (!clusterVisible || clusterSeedCount === 0) return null;
        return (
            <div
                className={`absolute pointer-events-none z-40 flex flex-wrap items-center justify-center gap-[1px] p-0.5 sm:p-1 ${clusterAnimClass}`}
                style={{
                    left: clusterPos.x,
                    top: clusterPos.y,
                    transform: 'translate(-50%,-50%)',
                    transition:
                        'left 0.3s cubic-bezier(0.2,0,0,1), top 0.3s cubic-bezier(0.2,0,0,1)',
                }}
            >
                {Array.from({ length: clusterSeedCount }).map((_, i) => (
                    <span
                        key={i}
                        className="rounded-full bg-[#171717] h-[6px] w-[6px] sm:h-[8px] sm:w-[8px] md:h-[10px] md:w-[10px]"
                    />
                ))}
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
                            width: 7,
                            height: 7,
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

