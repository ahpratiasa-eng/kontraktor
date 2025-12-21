import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Project, ProjectTemplate, RABItem, Worker, Material } from '../types';

/**
 * Hook for managing project templates
 * Templates are stored in Firestore under 'project_templates' collection
 */
export const useProjectTemplates = (user: User | null) => {
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load templates from Firestore
    useEffect(() => {
        if (!user) {
            setTemplates([]);
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, 'project_templates'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTemplates: ProjectTemplate[] = [];
            snapshot.forEach((doc) => {
                loadedTemplates.push({ id: doc.id, ...doc.data() } as ProjectTemplate);
            });
            // Sort by createdAt descending
            loadedTemplates.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTemplates(loadedTemplates);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    /**
     * Save current project as a template
     */
    const saveAsTemplate = async (project: Project, templateName: string, description?: string) => {
        if (!user) throw new Error('Must be logged in to save templates');

        const templateId = `template_${Date.now()}`;

        // Extract template data from project (without runtime-specific data)
        const templateData: ProjectTemplate = {
            id: templateId,
            name: templateName,
            description: description || `Template dari proyek ${project.name}`,
            createdAt: new Date().toISOString(),
            createdBy: user.email || 'unknown',
            // RAB items without id, progress, dates (will be regenerated)
            rabItems: (project.rabItems || []).map(item => ({
                category: item.category,
                name: item.name,
                unit: item.unit,
                volume: item.volume,
                unitPrice: item.unitPrice,
                isAddendum: item.isAddendum,
                ahsItemId: item.ahsItemId,
                ahsId: item.ahsId,
                priceLockedAt: item.priceLockedAt,
            })),
            // Workers without id (will be regenerated)
            workers: (project.workers || []).map(w => ({
                name: w.name,
                role: w.role,
                realRate: w.realRate,
                mandorRate: w.mandorRate,
                wageUnit: w.wageUnit,
            })),
            // Materials without id and stock (stock starts at 0)
            materials: (project.materials || []).map(m => ({
                name: m.name,
                unit: m.unit,
                minStock: m.minStock,
            })),
        };

        await setDoc(doc(db, 'project_templates', templateId), templateData);
        return templateId;
    };

    /**
     * Delete a template
     */
    const deleteTemplate = async (templateId: string) => {
        await deleteDoc(doc(db, 'project_templates', templateId));
    };

    /**
     * Apply template data to a new project object
     * Returns partial project data that can be merged with user input
     */
    const applyTemplate = (template: ProjectTemplate): {
        rabItems: RABItem[];
        workers: Worker[];
        materials: Material[];
    } => {
        let itemId = 1;
        let workerId = 1;
        let materialId = 1;

        return {
            rabItems: template.rabItems.map(item => ({
                ...item,
                id: itemId++,
                progress: 0,
                startDate: undefined,
                endDate: undefined,
            })),
            workers: template.workers.map(w => ({
                ...w,
                id: workerId++,
            })),
            materials: template.materials.map(m => ({
                ...m,
                id: materialId++,
                stock: 0,
            })),
        };
    };

    return {
        templates,
        isLoading,
        saveAsTemplate,
        deleteTemplate,
        applyTemplate,
    };
};

export default useProjectTemplates;
