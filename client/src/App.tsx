
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useRef } from 'react';
import { Upload, Copy, Check, File, HardDrive } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { UploadFileInput, FileStats, FileUploadResponse } from '../../server/src/schema';

function App() {
  const [stats, setStats] = useState<FileStats>({ total_files: 0, total_size: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<FileUploadResponse | null>(null);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load file statistics on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await trpc.getFileStats.query();
        setStats(result);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    loadStats();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:mime;base64, prefix
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (200MB limit)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    if (file.size > maxSize) {
      setError('File size must be under 200MB');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);
    setUploadedFile(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);

      // Convert file to base64
      const base64Data = await convertFileToBase64(file);
      
      const uploadInput: UploadFileInput = {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_data: base64Data,
      };

      const response = await trpc.uploadFile.mutate(uploadInput);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update uploaded file state
      setUploadedFile(response);
      
      // Update stats
      setStats(prev => ({
        total_files: prev.total_files + 1,
        total_size: prev.total_size + file.size,
      }));

    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateFileUrl = (fileId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/files/${fileId}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedAlert(true);
      setTimeout(() => setShowCopiedAlert(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📦 Earl Box
          </h1>
          <p className="text-gray-600">Simple, secure file sharing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="text-center border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-center mb-2">
                <File className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-blue-600">{stats.total_files.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600">Files Uploaded</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-center mb-2">
                <HardDrive className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold text-purple-600">{formatFileSize(stats.total_size)}</span>
              </div>
              <p className="text-sm text-gray-600">Total Storage</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Area */}
        <Card className="mb-6 border-dashed border-2 border-blue-300 hover:border-blue-400 transition-colors">
          <CardHeader>
            <CardTitle className="text-center text-blue-700">Upload Your File</CardTitle>
            <CardDescription className="text-center">
              Select a file to upload (max 200MB). Upload starts automatically!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative p-8 text-center cursor-pointer rounded-lg transition-colors ${
                uploading ? 'bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'
              }`}
              onClick={handleUploadAreaClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              {uploading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-600 font-medium">Uploading...</p>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600">{Math.round(uploadProgress)}% complete</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Click to select a file or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports all file types • Max 200MB
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success - File Link */}
        {uploadedFile && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Upload Successful! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-green-800">File Name</Label>
                <p className="text-green-700">{uploadedFile.original_name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-800">File Size</Label>
                <p className="text-green-700">{formatFileSize(uploadedFile.file_size)}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-800">Share Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={generateFileUrl(uploadedFile.id)}
                    readOnly
                    className="bg-white border-green-300 text-green-800"
                  />
                  <Button
                    onClick={() => copyToClipboard(generateFileUrl(uploadedFile.id))}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Copy Success Alert */}
        {showCopiedAlert && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Check className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Link copied to clipboard! ✨
            </AlertDescription>
          </Alert>
        )}

        {/* Features */}
        <Card className="mb-8 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Why Earl Box? 💎</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">✨</Badge>
                <div>
                  <p className="font-medium">Instant Upload</p>
                  <p className="text-sm text-gray-600">Files upload automatically when selected</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">🔗</Badge>
                <div>
                  <p className="font-medium">Permanent Links</p>
                  <p className="text-sm text-gray-600">Your files are stored permanently</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">📁</Badge>
                <div>
                  <p className="font-medium">All File Types</p>
                  <p className="text-sm text-gray-600">Support for any file format</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">🚀</Badge>
                <div>
                  <p className="font-medium">200MB Limit</p>
                  <p className="text-sm text-gray-600">Generous file size allowance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200 bg-white/30 backdrop-blur-sm rounded-lg">
          <p className="text-lg font-medium text-gray-700">
            Created by <span className="text-red-500">Earl Store❤️</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
