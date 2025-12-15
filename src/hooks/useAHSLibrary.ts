import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import type { AHSItem, PricingResource } from '../types';
import defaultAHSData from '../data/defaultAHS.json';
import defaultResourceData from '../data/defaultResources.json';

export const useAHSLibrary = (user: any) => {
    const [ahsItems, setAhsItems] = useState<AHSItem[]>([]);
    const [pricingResources, setPricingResources] = useState<PricingResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Import default AHS data
    const getDefaultAHSData = (): AHSItem[] => {
        return defaultAHSData as AHSItem[];
    };

    const getDefaultResourceData = (): PricingResource[] => {
        return defaultResourceData as PricingResource[];
    };

    // Fetch library data on mount/user change
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchLibraryData = async () => {
            setIsLoading(true);
            try {
                // Fetch AHS
                const ahsRef = doc(db, 'app_data', appId, 'settings', 'ahs_library');
                const ahsSnap = await getDoc(ahsRef);
                if (ahsSnap.exists()) {
                    setAhsItems(ahsSnap.data().items || []);
                } else {
                    setAhsItems(getDefaultAHSData());
                }

                // Fetch Resources
                const resRef = doc(db, 'app_data', appId, 'settings', 'resources_library');
                const resSnap = await getDoc(resRef);
                if (resSnap.exists()) {
                    setPricingResources(resSnap.data().items || []);
                } else {
                    setPricingResources(getDefaultResourceData());
                }
            } catch (e) {
                console.error('Failed to fetch library data:', e);
                // Use defaults on error
                setAhsItems(getDefaultAHSData());
                setPricingResources(getDefaultResourceData());
            } finally {
                setIsLoading(false);
            }
        };

        fetchLibraryData();
    }, [user]);

    // Save AHS Items
    const saveAhsItems = async (items: AHSItem[]) => {
        try {
            const docRef = doc(db, 'app_data', appId, 'settings', 'ahs_library');
            await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
            setAhsItems(items);
        } catch (e) {
            console.error('Failed to save AHS:', e);
            alert('Gagal menyimpan AHS');
        }
    };

    // Save Resources
    const saveResources = async (items: PricingResource[]) => {
        try {
            const docRef = doc(db, 'app_data', appId, 'settings', 'resources_library');
            await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
            setPricingResources(items);
        } catch (e) {
            console.error('Failed to save Resources:', e);
            alert('Gagal menyimpan Resources');
        }
    };

    // Reset AHS to Default
    const resetAHSToDefault = async () => {
        try {
            const defaultData = getDefaultAHSData();
            await saveAhsItems(defaultData);
            alert('Library AHS berhasil direset ke data bawaan!');
        } catch (e) {
            console.error('Failed to reset AHS:', e);
            alert('Gagal reset Library AHS');
        }
    };

    return {
        ahsItems,
        pricingResources,
        isLoading,
        saveAhsItems,
        saveResources,
        resetAHSToDefault,
        getDefaultAHSData,
    };
};

export default useAHSLibrary;
