/**
 * Custom hook for calculating player positions around a poker table
 * Handles rotation so the hero is always at the bottom center
 */

interface PlayerPosition {
    top: string;
    left: string;
}

interface UsePlayerPositionsReturn {
    getPlayerPosition: (index: number, total: number, heroPosition: number) => PlayerPosition;
    getPlayerAngle: (index: number, total: number, heroPosition: number) => number;
}

export const usePlayerPositions = (): UsePlayerPositionsReturn => {
    /**
     * Calculate the position of a player around the poker table
     * Rotates the table so the hero is always at the bottom center
     */
    const getPlayerPosition = (
        index: number,
        total: number,
        heroPosition: number
    ): PlayerPosition => {
        // Calculate offset to rotate the table
        // Hero should be at 90 degrees (bottom center)
        const heroAngleOffset = (heroPosition / total) * 2 * Math.PI;
        
        // Base angle of the player
        const baseAngle = (index / total) * 2 * Math.PI;
        
        // Rotated angle to place hero at the bottom
        // 90 degrees = Math.PI / 2 (bottom position)
        // Subtract to rotate clockwise on screen
        const angle = baseAngle - heroAngleOffset + Math.PI / 2;
        
        // Ellipse radii (adjusted for the table)
        const radiusX = 42; // Horizontal
        const radiusY = 35; // Vertical
        
        const x = 50 + radiusX * Math.cos(angle);
        const y = 50 + radiusY * Math.sin(angle);
        
        return {
            top: `${y}%`,
            left: `${x}%`
        };
    };

    /**
     * Calculate the angle of a player (useful for chip positioning)
     */
    const getPlayerAngle = (
        index: number,
        total: number,
        heroPosition: number
    ): number => {
        const heroAngleOffset = (heroPosition / total) * 2 * Math.PI;
        const baseAngle = (index / total) * 2 * Math.PI;
        return baseAngle - heroAngleOffset + Math.PI / 2;
    };

    return {
        getPlayerPosition,
        getPlayerAngle
    };
};
