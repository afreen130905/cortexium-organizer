import React from 'react';
import { Camera, CameraOff, BrainCircuit, Activity, RotateCcw, Download } from 'lucide-react';
import { Button } from '../components/Button';

export function Controls({ onAction, mode, cameraActive }) {
  const isLearn = mode === 'learn';

  const actions = [
    {
      id: 'start_camera',
      label: 'Start Camera',
      icon: Camera,
      variant: cameraActive ? 'ghost' : 'green',
      disabled: cameraActive,
    },
    {
      id: 'stop_camera',
      label: 'Stop Camera',
      icon: CameraOff,
      variant: cameraActive ? 'red' : 'ghost',
      disabled: !cameraActive,
    },
    {
      id: 'learn_mode',
      label: 'Learn Mode',
      icon: BrainCircuit,
      variant: isLearn ? 'white' : 'ghost',
      disabled: isLearn,
    },
    {
      id: 'predict_mode',
      label: 'Predict Mode',
      icon: Activity,
      variant: !isLearn ? 'green' : 'ghost',
      disabled: !isLearn,
    },
    {
      id: 'reset_learning',
      label: 'Reset Learning',
      icon: RotateCcw,
      variant: 'red',
    },
    {
      id: 'export_data',
      label: 'Export Dataset',
      icon: Download,
      variant: 'ghost',
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button
          key={a.id}
          variant={a.variant}
          icon={a.icon}
          onClick={() => onAction(a.id)}
          disabled={a.disabled}
          className="text-xs"
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
