'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileDown, FileText, AlertCircle } from "lucide-react";
import Papa from 'papaparse';
import { createNewNSP } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore } from '@/firebase';

type CSVRow = {
  serviceNumber: string;
  fullName: string;
  institution: string;
  posting: string;
};

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type !== 'text/csv') {
        setError('Invalid file type. Please upload a .csv file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!firestore) {
      setError('Firestore is not available. Please try again later.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        const totalRows = rows.length;

        if (totalRows === 0) {
          setError('The CSV file is empty or invalid.');
          setIsUploading(false);
          return;
        }
        
        const requiredHeaders = ['serviceNumber', 'fullName', 'institution', 'posting'];
        const actualHeaders = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          setError(`The CSV file is missing required columns: ${missingHeaders.join(', ')}`);
          setIsUploading(false);
          return;
        }

        let processedCount = 0;
        for (const row of rows) {
          if (row.serviceNumber && row.fullName && row.institution && row.posting) {
            try {
               // Assume a default district for now
              const DISTRICT_ID = 'district1';
              await createNewNSP(firestore, { 
                ...row,
                districtId: DISTRICT_ID
               });
            } catch (err: any) {
              console.error(`Failed to upload record for ${row.fullName}:`, err);
              // Optionally collect errors to display them later
            }
          }
          processedCount++;
          setUploadProgress((processedCount / totalRows) * 100);
        }

        setIsUploading(false);
        setFile(null);
        toast({
          title: 'Upload Complete',
          description: `Successfully processed ${totalRows} records.`,
        });
      },
      error: (err: any) => {
        setError(`An error occurred while parsing the file: ${err.message}`);
        setIsUploading(false);
      },
    });
  };
  
  const downloadTemplate = () => {
    const csvContent = "serviceNumber,fullName,institution,posting\nNSS123456,John Doe,University of Ghana,District Assembly";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "nsp_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload NSP Records</CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple NSP records at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full items-center space-x-2">
            <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isUploading} />
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
           {isUploading && (
            <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">{Math.round(uploadProgress)}% Complete</p>
            </div>
          )}
          {error && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
           )}
          <p className="text-xs text-muted-foreground">
            Only .csv files are accepted. Maximum file size: 5MB.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>CSV File Format Instructions</CardTitle>
          <CardDescription>
            Ensure your CSV file adheres to the following format for a successful upload.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                    <p className="text-sm font-medium">Download CSV Template</p>
                    <p className="text-sm text-muted-foreground">Get a pre-formatted template to ensure your data is correct.</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <FileDown className="mr-2 h-4 w-4"/>
                    Download
                </Button>
            </div>
            <div>
                <h4 className="font-medium">Required Columns</h4>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code className="font-semibold text-foreground">serviceNumber</code>: The unique national service number.</li>
                    <li><code className="font-semibold text-foreground">fullName</code>: The full name of the personnel.</li>
                    <li><code className="font-semibold text-foreground">institution</code>: The tertiary institution attended.</li>
                    <li><code className="font-semibold text-foreground">posting</code>: The place of primary assignment.</li>
                </ul>
            </div>
            <div className="rounded-md bg-muted p-4">
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium">Example:</p>
                        <pre className="mt-1 text-xs"><code>serviceNumber,fullName,institution,posting<br />NSS123456,John Doe,University of Ghana,District Assembly</code></pre>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
