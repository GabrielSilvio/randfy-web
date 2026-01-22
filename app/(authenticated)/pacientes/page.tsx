'use client';

import { useEffect, useState } from 'react';
import { apiClient, PatientResponse, PatientData, CurrentUserResponse } from '@/lib/api';
import { PatientModal } from '@/components/prontuario/patient-modal';

export default function PacientesPage() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userData, setUserData] = useState<CurrentUserResponse | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPatients = async (tenantId: number) => {
    try {
      const patientsResponse = await apiClient.getPatients(tenantId);
      setPatients(patientsResponse.data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await apiClient.getCurrentUser();
        setUserData(user);

        const tenantId = user.user?.tenant_id;
        if (!tenantId) return;

        await loadPatients(tenantId);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSavePatient = async (data: PatientData) => {
    const tenantId = userData?.user?.tenant_id;
    if (!tenantId) return;

    setIsSavingPatient(true);
    setErrorMessage(null);

    try {
      const newPatient = await apiClient.createPatient(tenantId, data);
      setIsPatientModalOpen(false);
      setSuccessMessage(`Paciente "${newPatient.name}" cadastrado com sucesso!`);
      
      // Reload patients list
      await loadPatients(tenantId);
      
      // Hide success message after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error creating patient:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao cadastrar paciente';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSavingPatient(false);
    }
  };

  const calculateAge = (dob?: string): string => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  const formatPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 13) {
      // +55 11 99999-9999
      return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(search) ||
      patient.phone_number.includes(search) ||
      (patient.cpf && patient.cpf.includes(search))
    );
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Success Toast */}
        {successMessage && (
          <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
              <span className="material-symbols-outlined text-emerald-600 shrink-0">check_circle</span>
              <p className="font-medium text-sm">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {errorMessage && (
          <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
              <span className="material-symbols-outlined text-red-600 shrink-0">error</span>
              <p className="font-medium text-sm">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Pacientes</h2>
            <p className="text-slate-600">Gerencie os pacientes cadastrados na clínica</p>
          </div>
          <button
            onClick={() => setIsPatientModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-blue-200"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Novo Paciente
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone ou CPF..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <p className="text-slate-500 mt-4">Carregando pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-slate-300">
                people
              </span>
              <p className="text-slate-500 mt-2">
                {searchTerm
                  ? 'Nenhum paciente encontrado com a busca'
                  : 'Nenhum paciente cadastrado'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsPatientModalOpen(true)}
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Cadastrar Primeiro Paciente
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Paciente</div>
                <div className="col-span-2">Telefone</div>
                <div className="col-span-2">Idade</div>
                <div className="col-span-2">Sexo</div>
                <div className="col-span-2 text-right">Cadastro</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="md:grid md:grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    {/* Name */}
                    <div className="col-span-4 flex items-center gap-3 mb-2 md:mb-0">
                      <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{patient.name}</p>
                        {patient.cpf && (
                          <p className="text-xs text-slate-500">CPF: {patient.cpf}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="col-span-2 flex items-center mb-2 md:mb-0">
                      <a
                        href={`https://wa.me/${patient.phone_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        {formatPhone(patient.phone_number)}
                      </a>
                    </div>

                    {/* Age */}
                    <div className="col-span-2 flex items-center mb-2 md:mb-0">
                      <span className="text-sm text-slate-600">{calculateAge(patient.dob)}</span>
                    </div>

                    {/* Sex */}
                    <div className="col-span-2 flex items-center mb-2 md:mb-0">
                      <span className="text-sm text-slate-600">
                        {patient.sex === 'M' ? 'Masculino' : patient.sex === 'F' ? 'Feminino' : '-'}
                      </span>
                    </div>

                    {/* Created At */}
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="text-sm text-slate-500">
                        {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Count */}
        {filteredPatients.length > 0 && (
          <div className="mt-4 text-sm text-slate-500">
            {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} encontrado{filteredPatients.length !== 1 ? 's' : ''}
          </div>
        )}
        </div>
      </div>

      {/* Patient Modal */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
        isLoading={isSavingPatient}
      />
    </div>
  );
}
