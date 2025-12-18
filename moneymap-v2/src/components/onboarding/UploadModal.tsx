import { useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useDataStore } from '@/lib/store/useDataStore';
import { useRouter } from 'next/navigation';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const { generateData } = useDataStore();
    const router = useRouter();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateAndSetFile = useCallback((incomingFile: File) => {
        // For now, accept any file, but we could restrict to .csv, .pdf later
        setFile(incomingFile);
        setError(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    }, [validateAndSetFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        setIsProcessing(true);

        // Simulate processing delay
        setTimeout(() => {
            // Use the new engine to generate data, simulating a successful parse
            generateData('full');

            setIsProcessing(false);
            onClose();
            router.push('/dashboard');
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Upload Statement</h2>
                    <p className="text-zinc-400 text-sm">
                        Upload your bank statement (CSV or PDF) to analyze your spending.
                        <br />
                        <span className="text-xs text-zinc-500 italic">Note: Processing happens entirely in your browser.</span>
                    </p>
                </div>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            flex flex-col items-center justify-center gap-4 cursor-pointer
            ${isDragging
                            ? 'border-purple-500 bg-purple-500/10'
                            : file
                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                : 'border-zinc-700 hover:border-zinc-500 hover:bg-white/5'
                        }
          `}
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".csv,.pdf,.txt"
                    />

                    {file ? (
                        <>
                            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-white">{file.name}</p>
                                <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 mt-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                }}
                            >
                                Remove
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Upload className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-white">
                                    {isDragging ? 'Drop file here' : 'Click or drag file'}
                                </p>
                                <p className="text-xs text-zinc-500">CSV, PDF, or Text files</p>
                            </div>
                        </>
                    )}
                </div>

                {error && (
                    <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleProcess}
                        disabled={!file || isProcessing}
                        className="bg-purple-600 hover:bg-purple-500 text-white min-w-[100px]"
                    >
                        {isProcessing ? 'Processing...' : 'Analyze'}
                    </Button>
                </div>
            </GlassCard>
        </div>
    );
}
