import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Play } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { GlassCard } from './GlassCard';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  mode?: 'clients' | 'products' | 'any';
}

export const QRScanner: React.FC<QRScannerProps> = ({ 
  onScanSuccess, 
  onClose, 
  mode = 'any' 
}) => {
  const { t } = useTranslation();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'html5-qr-reader-view';

  // Demo presets for simulation
  const clientPresets = [
    { code: 'CLI-1001', name: 'Al-Firdous Cafe (CLI-1001)' },
    { code: 'CLI-1002', name: 'Sultan Shisha Lounge (CLI-1002)' },
    { code: 'CLI-1003', name: 'Al-Waha Cafe (CLI-1003)' },
    { code: 'CLI-1004', name: 'Breeze Beach Lounge (CLI-1004)' },
    { code: 'CLI-1005', name: 'Layali Cafe (CLI-1005)' }
  ];

  const productPresets = [
    { code: 'SHI-ALF-01', name: 'Al-Fakher Two Apples 1kg' },
    { code: 'SHI-ALF-02', name: 'Al-Fakher Mint 1kg' },
    { code: 'SHI-NAK-01', name: 'Nakhla Double Apple 1kg' },
    { code: 'COA-IND-01', name: 'Indonesian Charcoal 10kg' },
    { code: 'COA-HEX-01', name: 'Hexagonal Charcoal 10kg' },
    { code: 'ACC-FOI-01', name: 'Shisha Foil Roll 100m' },
    { code: 'ACC-TNG-01', name: 'Metal Charcoal Tongs' }
  ];

  const activePresets = mode === 'clients' 
    ? clientPresets 
    : mode === 'products' 
      ? productPresets 
      : [...clientPresets, ...productPresets];

  useEffect(() => {
    // Start scanner automatically on load
    const startScanner = async () => {
      try {
        setCameraError(null);
        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Success callback
            cleanupScanner();
            onScanSuccess(decodedText);
          },
          () => {
            // Verbose error logging ignored to keep UI clean
          }
        );
        setScanning(true);
      } catch (err: any) {
        console.warn('QR Camera initialization failed. Falling back to simulator.', err);
        setCameraError(
          'Camera access not available (requires HTTPS or localhost). Please use the Simulator dropdown below for testing.'
        );
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      cleanupScanner();
    };
  }, []);

  const cleanupScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current = null;
        }).catch((e) => {
          console.error('Error stopping QR reader', e);
        });
      } catch (e) {
        console.error('Error cleaning up QR reader', e);
      }
    }
  };

  const handleSimulate = () => {
    if (simulatedCode) {
      cleanupScanner();
      onScanSuccess(simulatedCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <GlassCard glowColor="cyan" className="w-full max-w-md p-6 bg-slate-900 border border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-neon-cyan" />
            <h3 className="text-lg font-bold text-white">
              {mode === 'clients' ? t('scanClientQR') : mode === 'products' ? t('scanProductQR') : 'QR Code Scanner'}
            </h3>
          </div>
          <button 
            onClick={() => {
              cleanupScanner();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed Container */}
        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border border-slate-800 flex flex-col items-center justify-center mb-6">
          <div id={elementId} className="w-full h-full"></div>
          
          {cameraError && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-950/90 text-sm">
              <Camera className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-text-secondary leading-relaxed mb-4">{cameraError}</p>
            </div>
          )}

          {scanning && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live Scanner Active
            </div>
          )}
        </div>

        {/* Simulation / Fallback Section */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-neon-cyan uppercase tracking-wider">
              {t('simulatedScan')} (For Dev Testing)
            </label>
            <div className="flex gap-2">
              <select 
                value={simulatedCode}
                onChange={(e) => setSimulatedCode(e.target.value)}
                className="flex-1 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white"
              >
                <option value="">-- Select Target to Scan --</option>
                {activePresets.map((preset) => (
                  <option key={preset.code} value={preset.code}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={!simulatedCode}
                className="btn-primary-cyan flex items-center gap-1 py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {t('simulateScanBtn')}
              </button>
            </div>
          </div>
        </div>

      </GlassCard>
    </div>
  );
};
