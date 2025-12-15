import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import type { LandingPageConfig } from '../types';

const defaultConfig: LandingPageConfig = {
    companyName: 'Guna Karya',
    tagline: 'Wujudkan Hunian Impian Anda',
    subtitle: 'Layanan konstruksi profesional untuk rumah tinggal, renovasi, dan pembangunan baru. Kualitas terjamin dengan harga transparan.',
    whatsappNumber: '6281234567890',
    instagramHandle: 'guna.karya',
    portfolioItems: []
};

export const useLandingConfig = () => {
    const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(defaultConfig);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch config on mount
    useEffect(() => {
        const fetchLandingConfig = async () => {
            try {
                const docRef = doc(db, 'app_data', appId, 'settings', 'landing_page');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLandingConfig(docSnap.data() as LandingPageConfig);
                } else {
                    setLandingConfig(defaultConfig);
                }
            } catch (e) {
                console.error('Failed to fetch landing config:', e);
                setLandingConfig(defaultConfig);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLandingConfig();
    }, []);

    // Save config
    const saveLandingConfig = async (config: LandingPageConfig) => {
        try {
            const docRef = doc(db, 'app_data', appId, 'settings', 'landing_page');
            await setDoc(docRef, config);
            setLandingConfig(config);
        } catch (e) {
            console.error('Failed to save landing config:', e);
            throw e;
        }
    };

    return {
        landingConfig,
        saveLandingConfig,
        isLoading,
    };
};

export default useLandingConfig;
