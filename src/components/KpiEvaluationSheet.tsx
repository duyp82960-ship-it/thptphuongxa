import React from 'react';
import { useKpi } from '../context/KpiContext';
import { TeacherKpiEvaluation } from '../types';
import { ThreeTierKpiEvaluationModal } from './ThreeTierKpiEvaluationModal';

interface KpiEvaluationSheetProps {
  initialStaffId?: string;
  evaluationRecord?: TeacherKpiEvaluation;
  onClose?: () => void;
}

export const KpiEvaluationSheet: React.FC<KpiEvaluationSheetProps> = ({
  initialStaffId,
  evaluationRecord,
  onClose,
}) => {
  const { setActiveTab } = useKpi();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveTab('giaovien');
    }
  };

  return (
    <div className="w-full">
      <ThreeTierKpiEvaluationModal
        isOpen={true}
        onClose={handleClose}
        initialStaffId={initialStaffId}
        evaluationRecord={evaluationRecord}
        onSuccess={() => {}}
      />
    </div>
  );
};
