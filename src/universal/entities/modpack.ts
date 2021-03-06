import { RuntimeVersions } from './instance.schema';

/**
 * Represent a common modpack in a zip file.
 */
export interface Modpack {
    /**
     * The relative path to the root of minecraft data folder. Normally should be the root folder '.' or '.minecraft' folder
     */
    root: string; 
    /**
     * Provided version
     */
    runtime: RuntimeVersions;
}
