import { useState } from 'react';

export type ViewType = 'dashboard' | 'project-list' | 'project-detail' | 'report-view' | 'user-management' | 'trash-bin' | 'landing-settings' | 'ahs-library';

export const useModalManager = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<string | null>(null);

    const openModal = (type: string) => {
        setModalType(type);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType(null);
    };

    return {
        showModal,
        setShowModal,
        modalType,
        setModalType,
        openModal,
        closeModal,
    };
};

export const useViewManager = () => {
    const [view, setView] = useState<ViewType>('dashboard');
    const [activeTab, setActiveTab] = useState('dashboard');

    return {
        view,
        setView,
        activeTab,
        setActiveTab,
    };
};

export default useModalManager;
