import { useState, useEffect } from 'react';
import {
  Loader2
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import DashboardOverview from './components/DashboardOverview';
import ProjectDetailView from './components/ProjectDetailView';
import ReportView from './components/ReportView';
import ModalManager from './components/ModalManager';
import type { Material } from './types'; // Import Material type
import LandingPage from './components/LandingPage';
import LandingEditor from './components/LandingEditor';
import AHSLibraryView from './components/AHSLibraryView';
import TrashBinView from './components/TrashBinView';
import UserManagementView from './components/UserManagementView';
import LandingSettingsView from './components/LandingSettingsView';
import AnalyticsView from './components/AnalyticsView';
import ApiKeysView from './components/ApiKeysView';

import {
  doc, deleteDoc, setDoc
} from 'firebase/firestore';

import { db } from './lib/firebase';
import { loadDemoData as loadDemoDataUtil } from './utils/demoData';
import {
  useFormStates, useAHSLibrary, useLandingConfig, useProjectHandlers,
  useAuth, useProjects, useViewManager, useModalManager
} from './hooks';

// Parse URL params for client view (needed before hooks)
const getClientProjectId = () => {
  const params = new URLSearchParams(window.location.search);
  const pId = params.get('projectId');
  const mode = params.get('mode');
  return (pId && mode === 'client') ? pId : null;
};

const App = () => {
  const {
    user, userRole, originalRole, impersonateRole, authStatus, isClientView, appUsers,
    handleLogin, handleLogout,
    canAccessManagement, canEditProject, canSeeMoney, canAccessWorkers, canAccessFinance,
    canViewKurvaS, canViewInternalRAB, canAddWorkers, canViewProgressTab
  } = useAuth();


  const clientProjectId = getClientProjectId();

  // Projects - now managed by useProjects hook
  const {
    projects, activeProject, setActiveProjectId,
    isSyncing, setIsSyncing, updateProject
  } = useProjects(user, isClientView, clientProjectId);

  // View & Modal State
  const { view, setView, activeTab, setActiveTab } = useViewManager();
  const { showModal, setShowModal, modalType, setModalType } = useModalManager();

  // ahsItems and pricingResources now from useAHSLibrary hook
  // landingConfig now from useLandingConfig hook
  const [showLandingEditor, setShowLandingEditor] = useState(false);

  // Form States - now managed by useFormStates hook (~50 lines moved)
  const formStates = useFormStates();
  const {
    inputName, setInputName, inputClient, setInputClient, inputLocation, setInputLocation,
    inputOwnerPhone, setInputOwnerPhone, inputBudget, setInputBudget, inputStartDate, setInputStartDate,
    inputEndDate, setInputEndDate, rabCategory, setRabCategory, rabItemName, setRabItemName,
    rabUnit, setRabUnit, rabVol, setRabVol, rabPrice, setRabPrice, selectedRabItem, setSelectedRabItem,
    selectedAhsId, setSelectedAhsId, progressInput, setProgressInput, progressDate, setProgressDate,
    progressNote, setProgressNote, paymentAmount, setPaymentAmount, selectedWorkerId, setSelectedWorkerId,
    inputWorkerRole, setInputWorkerRole, inputWageUnit, setInputWageUnit, inputRealRate, setInputRealRate,
    inputMandorRate, setInputMandorRate, stockType, setStockType, stockQty, setStockQty,
    stockDate, setStockDate, stockNotes, setStockNotes,
    selectedMaterial, setSelectedMaterial,
    inputMaterialName, setInputMaterialName, inputMaterialUnit, setInputMaterialUnit,
    inputMinStock, setInputMinStock, inputInitialStock, setInputInitialStock,
    inputHeroImage, setInputHeroImage,
    inputEmail, setInputEmail, inputRole, setInputRole, aiPrompt, setAiPrompt, isGeneratingAI,
    attendanceDate, setAttendanceDate, attendanceData, setAttendanceData, evidencePhoto,
    evidenceLocation, isGettingLoc,
    transactionDesc, setTransactionDesc, transactionAmount, setTransactionAmount, transactionDate, setTransactionDate,
    transactionType, setTransactionType, transactionCategory, setTransactionCategory,
    transactionProof, setTransactionProof,
  } = formStates;

  // AHS Library - now managed by useAHSLibrary hook (~60 lines moved)
  const {
    ahsItems, pricingResources, saveAhsItems, saveResources, resetAHSToDefault
  } = useAHSLibrary(user);

  // Landing Config - now managed by useLandingConfig hook (~40 lines moved)
  const { landingConfig, saveLandingConfig } = useLandingConfig();





  // Project Handlers - now managed by useProjectHandlers hook (~400 lines moved)
  const projectHandlers = useProjectHandlers({
    user, activeProject, updateProject, setShowModal, setModalType, ahsItems, setActiveProjectId,
    ...formStates
  });

  const {
    handleSaveRAB, deleteRABItem, handleUpdateProgress, handleSaveProject,
    prepareEditProject, prepareEditRABItem, handlePayWorker, handleSaveWorker,
    handleEditWorker, handleDeleteWorker, handleStockMovement, handleSaveMaterial,
    handleEditMaterial, handleDeleteMaterial, handleTransferMaterial,
    handleSoftDeleteProject, handleRestoreProject, handlePermanentDeleteProject,
    handlePhotoUpload, saveAttendanceWithEvidence,
    getFilteredEvidence, openModal, handleGenerateRAB, handleImportRAB,
    handleSaveSchedule, prepareEditSchedule, handleSaveTransaction, handleSaveQC,
    handleSaveDefect, handleUpdateDefectStatus, handleAutoSchedule, handleGenerateWeeklyReport, handleUpdateWeeklyReport
  } = projectHandlers;
  // Pengawas ga boleh tambah tukang

  // Helper to prepare material edit
  const handlePrepareEditMaterial = (m: Material) => {
    setSelectedMaterial(m);
    setInputMaterialName(m.name);
    setInputMaterialUnit(m.unit);
    setInputMinStock(m.minStock);
    setInputInitialStock(m.stock); // Just for display if needed, though we don't save it
    setModalType('newMaterial');
    setShowModal(true);
  };

  // Effects
  // Effects
  // Set view for client mode
  useEffect(() => {
    if (clientProjectId) {
      setView('project-detail');
    }
  }, [clientProjectId]);







  const handleAddUser = async () => { if (!inputEmail || !inputName) return; try { await setDoc(doc(db, 'app_users', inputEmail), { email: inputEmail, name: inputName, role: inputRole }); alert("User berhasil ditambahkan!"); setShowModal(false); setInputEmail(''); setInputName(''); } catch (e) { alert("Gagal menambah user."); } };
  const handleDeleteUser = async (emailToDelete: string) => { if (emailToDelete === user?.email) return alert("Tidak bisa hapus diri sendiri!"); if (confirm(`Hapus akses ${emailToDelete}?`)) { try { await deleteDoc(doc(db, 'app_users', emailToDelete)); } catch (e) { alert("Gagal."); } } };



  // Demo Data - now uses utility function (~300 lines moved to utils/demoData.ts)
  const loadDemoData = () => loadDemoDataUtil(user, setIsSyncing);

  if (!user && authStatus !== 'loading' && !isClientView) return <LandingPage onLogin={handleLogin} config={landingConfig} />;
  if (authStatus === 'loading' && !isClientView) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } .print\\:break-inside-avoid { break-inside: avoid; } }`}</style>

      {/* SIDEBAR (Desktop Only) */}
      {/* SIDEBAR (Desktop Only) */}
      {!isClientView && (
        <Sidebar
          view={view}
          setView={setView}
          openModal={openModal}
          handleLogout={handleLogout}
          userRole={userRole}
          originalRole={originalRole}
          impersonateRole={impersonateRole}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 ${!isClientView ? 'md:ml-64' : ''} flex flex-col relative pb-20 md:pb-0 overflow-x-hidden`}>

        {/* HEADER (Desktop: Offset left, Mobile: Full) */}
        {!isClientView && (
          <Header
            view={view}
            setView={setView}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            userRole={userRole}
            openModal={openModal}
            handleLogout={handleLogout}
            canAccessManagement={canAccessManagement()}
            canEditProject={canEditProject()}
          />
        )}

        {/* CONTENT */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">

          {/* TRASH BIN VIEW */}
          {/* TRASH BIN VIEW */}
          {view === 'trash-bin' && userRole !== 'pengawas' && (
            <TrashBinView
              projects={projects}
              onRestore={handleRestoreProject}
              onDeletePermanent={handlePermanentDeleteProject}
              canAccessManagement={canAccessManagement()}
            />
          )}

          {/* USER MANAGEMENT VIEW */}
          {view === 'user-management' && canAccessManagement() && (
            <UserManagementView
              appUsers={appUsers}
              currentUser={user}
              onDeleteUser={handleDeleteUser}
              onAddUser={() => openModal('addUser')}
              setView={setView}
            />
          )}

          {/* LANDING PAGE SETTINGS VIEW */}
          {/* LANDING PAGE SETTINGS VIEW */}
          {view === 'landing-settings' && canAccessManagement() && (
            <LandingSettingsView
              config={landingConfig}
              onEdit={() => setShowLandingEditor(true)}
            />
          )}

          {/* API KEYS VIEW */}
          {view === 'api-keys' && canAccessManagement() && (
            <ApiKeysView setView={setView} />
          )}

          {view === 'ahs-library' && (
            <main className="space-y-6">
              <AHSLibraryView
                ahsItems={ahsItems}
                onSave={saveAhsItems}
                resources={pricingResources}
                onSaveResources={saveResources}
                onResetToDefault={resetAHSToDefault}
              />
            </main>
          )}

          {view === 'dashboard' && userRole !== 'pengawas' && (
            <DashboardOverview
              projects={projects}
              setView={setView}
              setActiveProjectId={setActiveProjectId}
            />
          )}

          {/* Redirect Pengawas if they try to access dashboard? Or just let them see empty? 
              Better to just show nothing or maybe redirect in useEffect. 
              For now, hiding it is safe. */ }

          {view === 'project-list' && (
            <DashboardView
              user={user}
              projects={projects}
              setActiveProjectId={setActiveProjectId}
              setView={setView}
              isSyncing={isSyncing}
              loadDemoData={loadDemoData}
              canEditProject={canEditProject()}
              handleSoftDeleteProject={handleSoftDeleteProject}
            />
          )}

          {view === 'analytics' && (
            <AnalyticsView projects={projects} />
          )}

          {view === 'project-detail' && activeProject && !isClientView && (
            <ProjectDetailView
              canAccessFinance={canAccessFinance()}
              canAccessWorkers={canAccessWorkers()}
              canSeeMoney={canSeeMoney()}
              canEditProject={canEditProject()}
              canViewKurvaS={canViewKurvaS()}
              canViewInternalRAB={canViewInternalRAB()}
              canAddWorkers={canAddWorkers()}
              canViewProgressTab={canViewProgressTab()}
              prepareEditProject={prepareEditProject}
              prepareEditRABItem={prepareEditRABItem}
              prepareEditSchedule={prepareEditSchedule}
              handleAutoSchedule={handleAutoSchedule}
              handleGenerateWeeklyReport={handleGenerateWeeklyReport}
              handleUpdateWeeklyReport={handleUpdateWeeklyReport}
              activeProject={activeProject}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isClientView={isClientView}
              userRole={userRole}
              setView={setView}
              updateProject={updateProject}
              openModal={openModal}
              modalType={modalType}
              showModal={showModal}
              setModalType={setModalType}
              setShowModal={setShowModal}
              setSelectedRabItem={setSelectedRabItem}
              setProgressInput={setProgressInput}
              setProgressDate={setProgressDate}
              setSelectedWorkerId={setSelectedWorkerId}
              handleUpdateDefectStatus={handleUpdateDefectStatus}
              setPaymentAmount={setPaymentAmount}
              setSelectedMaterial={setSelectedMaterial}
              deleteRABItem={deleteRABItem}
              handleEditWorker={handleEditWorker}
              handleDeleteWorker={handleDeleteWorker}
              handleDeleteMaterial={handleDeleteMaterial}
              handlePrepareEditMaterial={handlePrepareEditMaterial}
              ahsItems={ahsItems}
              setTransactionType={setTransactionType}
              setTransactionCategory={setTransactionCategory}
              projects={projects}
              handleTransferMaterial={handleTransferMaterial}
            />
          )}

          {/* Client View Loading/Error State */}
          {view === 'project-detail' && !activeProject && isClientView && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Memuat Data Proyek...</h2>
              <p className="text-slate-500 max-w-md">
                Mohon tunggu sebentar. Jika halaman ini tidak berubah dalam beberapa detik,
                link proyek mungkin tidak valid atau sudah kadaluarsa.
              </p>
            </div>
          )}
        </div>

        {/* CLIENT VIEW ProjectDetailView - Outside padded container for full width */}
        {view === 'project-detail' && activeProject && isClientView && (
          <div className="fixed inset-0 bg-slate-50 z-40 overflow-y-auto">
            <ProjectDetailView
              canAccessFinance={canAccessFinance()}
              canAccessWorkers={canAccessWorkers()}
              canSeeMoney={canSeeMoney()}
              canEditProject={canEditProject()}
              canViewKurvaS={canViewKurvaS()}
              canViewInternalRAB={canViewInternalRAB()}
              canAddWorkers={canAddWorkers()}
              canViewProgressTab={canViewProgressTab()}
              prepareEditProject={prepareEditProject}

              prepareEditRABItem={prepareEditRABItem}
              prepareEditSchedule={prepareEditSchedule}
              activeProject={activeProject}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isClientView={isClientView}
              userRole={userRole}
              setView={setView}
              updateProject={updateProject}
              openModal={openModal}
              modalType={modalType}
              showModal={showModal}
              setModalType={setModalType}
              setShowModal={setShowModal}
              setSelectedRabItem={setSelectedRabItem}
              setProgressInput={setProgressInput}
              setProgressDate={setProgressDate}
              setSelectedWorkerId={setSelectedWorkerId}
              setPaymentAmount={setPaymentAmount}
              setSelectedMaterial={setSelectedMaterial}
              deleteRABItem={deleteRABItem}
              handleEditWorker={handleEditWorker}
              handleDeleteWorker={handleDeleteWorker}
              handleDeleteMaterial={handleDeleteMaterial}
              handlePrepareEditMaterial={handlePrepareEditMaterial}
              ahsItems={ahsItems}
              setTransactionType={setTransactionType}
              setTransactionCategory={setTransactionCategory}
              projects={projects}
              handleTransferMaterial={handleTransferMaterial}
            />
          </div>
        )}

        {/* REPORT VIEW - Outside padded container for full width */}
        {view === 'report-view' && activeProject && (canSeeMoney() || isClientView) && (
          <ReportView
            activeProject={activeProject}
            setView={setView}
            isClientView={isClientView}
            canViewInternalRAB={canViewInternalRAB()}
            landingConfig={landingConfig}
          />
        )}
      </div>

      <ModalManager
        modalType={modalType}
        setModalType={setModalType}
        showModal={showModal}
        setShowModal={setShowModal}
        handleEditProject={handleSaveProject}
        handleSaveRAB={handleSaveRAB}
        handleUpdateProgress={handleUpdateProgress}
        handlePayWorker={handlePayWorker}
        handleSaveWorker={handleSaveWorker}
        handleStockMovement={handleStockMovement}
        handleSaveMaterial={handleSaveMaterial}
        handleEditMaterial={handleEditMaterial}
        handleAddUser={handleAddUser}
        handleGenerateRAB={handleGenerateRAB}
        handleImportRAB={handleImportRAB}
        handleSaveSchedule={handleSaveSchedule}
        saveAttendanceWithEvidence={saveAttendanceWithEvidence}
        getFilteredEvidence={getFilteredEvidence}
        inputName={inputName} setInputName={setInputName}
        inputClient={inputClient} setInputClient={setInputClient}
        inputLocation={inputLocation} setInputLocation={setInputLocation}
        inputOwnerPhone={inputOwnerPhone} setInputOwnerPhone={setInputOwnerPhone}
        inputBudget={inputBudget} setInputBudget={setInputBudget}
        inputStartDate={inputStartDate} setInputStartDate={setInputStartDate}
        inputEndDate={inputEndDate} setInputEndDate={setInputEndDate}
        inputHeroImage={inputHeroImage} setInputHeroImage={setInputHeroImage}
        rabCategory={rabCategory} setRabCategory={setRabCategory}
        rabItemName={rabItemName} setRabItemName={setRabItemName}
        rabUnit={rabUnit} setRabUnit={setRabUnit}
        rabVol={rabVol} setRabVol={setRabVol}
        rabPrice={rabPrice} setRabPrice={setRabPrice}
        progressInput={progressInput} setProgressInput={setProgressInput}
        progressDate={progressDate} setProgressDate={setProgressDate}
        progressNote={progressNote} setProgressNote={setProgressNote}
        paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount}
        inputWorkerRole={inputWorkerRole} setInputWorkerRole={setInputWorkerRole}
        inputWageUnit={inputWageUnit} setInputWageUnit={setInputWageUnit}
        inputRealRate={inputRealRate} setInputRealRate={setInputRealRate}
        inputMandorRate={inputMandorRate} setInputMandorRate={setInputMandorRate}
        stockType={stockType} setStockType={setStockType}
        stockQty={stockQty} setStockQty={setStockQty}
        stockDate={stockDate} setStockDate={setStockDate}
        stockNotes={stockNotes} setStockNotes={setStockNotes}
        selectedMaterial={selectedMaterial}
        inputMaterialName={inputMaterialName} setInputMaterialName={setInputMaterialName}
        inputMaterialUnit={inputMaterialUnit} setInputMaterialUnit={setInputMaterialUnit}
        inputMinStock={inputMinStock} setInputMinStock={setInputMinStock}
        inputInitialStock={inputInitialStock} setInputInitialStock={setInputInitialStock}
        inputEmail={inputEmail} setInputEmail={setInputEmail}
        inputRole={inputRole} setInputRole={setInputRole}
        aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
        isGeneratingAI={isGeneratingAI}
        attendanceDate={attendanceDate} setAttendanceDate={setAttendanceDate}
        attendanceData={attendanceData} setAttendanceData={setAttendanceData}
        evidencePhoto={evidencePhoto}
        evidenceLocation={evidenceLocation}
        handlePhotoUpload={handlePhotoUpload}
        isGettingLoc={isGettingLoc}
        activeProject={activeProject}
        selectedRabItem={selectedRabItem}
        selectedWorkerId={selectedWorkerId}
        ahsItems={ahsItems}
        resources={pricingResources}
        selectedAhsId={selectedAhsId}
        setSelectedAhsId={setSelectedAhsId}
        // Transaction Props
        handleSaveTransaction={handleSaveTransaction}
        transactionDesc={transactionDesc} setTransactionDesc={setTransactionDesc}
        transactionAmount={transactionAmount} setTransactionAmount={setTransactionAmount}
        transactionDate={transactionDate} setTransactionDate={setTransactionDate}
        transactionType={transactionType} setTransactionType={setTransactionType}
        transactionCategory={transactionCategory} setTransactionCategory={setTransactionCategory}
        transactionProof={transactionProof} setTransactionProof={setTransactionProof}
        handleSaveQC={handleSaveQC}
        handleSaveDefect={handleSaveDefect}
      />


      {/* LANDING PAGE EDITOR MODAL */}
      {showLandingEditor && landingConfig && (
        <LandingEditor
          config={landingConfig}
          onSave={saveLandingConfig}
          onClose={() => setShowLandingEditor(false)}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileNav
        view={view}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setView={setView}
        userRole={userRole}
        isClientView={isClientView}
        canViewKurvaS={canViewKurvaS()}
        isHidden={showModal}
      />

    </div>
  );
};

export default App;