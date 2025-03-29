
import { useState, useRef } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileUp } from "lucide-react";

interface CheckInStep2Props {
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  verificationComplete: boolean;
  setVerificationComplete: (complete: boolean) => void;
  onNext: () => void;
}

const CheckInStep2 = ({
  uploadedFiles,
  setUploadedFiles,
  verificationComplete,
  setVerificationComplete,
  onNext,
}: CheckInStep2Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      
      // Reset verification status and message when new files are uploaded
      setVerificationComplete(false);
      setVerificationMessage(null);
      
      // Reset the input value so the same file can be uploaded again if needed
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    
    // Reset verification when files change
    setVerificationComplete(false);
    setVerificationMessage(null);
  };

  const handleVerify = () => {
    // Simulate verification
    setVerificationMessage("No errors found!");
    setVerificationComplete(true);
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <p className="text-sm text-muted-foreground">Check-in Step 2 of 3</p>
        <DialogTitle className="text-xl">Upload and Automatic Checks</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <Button 
          className="w-full flex items-center gap-2" 
          onClick={handleUploadClick}
          variant="outline"
        >
          <FileUp size={16} />
          Upload file
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
        />

        {uploadedFiles.length > 0 && (
          <div className="border rounded-md p-3 space-y-2">
            <p className="text-sm font-medium">Uploaded files:</p>
            <ul className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between border-b pb-1">
                  <span className="text-sm truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          onClick={handleVerify} 
          disabled={uploadedFiles.length === 0}
          variant="outline"
          className="w-full"
        >
          Verify files
        </Button>

        {verificationMessage && (
          <div className="p-2 text-center text-sm text-green-600 font-medium">
            {verificationMessage}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onNext} disabled={!verificationComplete}>
          Proceed
        </Button>
      </div>
    </div>
  );
};

export default CheckInStep2;
