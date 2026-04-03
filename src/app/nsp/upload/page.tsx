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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type CSVRow = {
  email: string;
  nssNumber: string;
  surname: string;
  otherNames: string;
  institution: string;
  courseOfStudy: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  residentialAddress: string;
  gpsAddress: string;
  posting: string;
  region: string;
  district: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  isEmployed: string; // Will be 'yes' or 'no'
};

const requiredHeaders = [
    'email', 'nssNumber', 'surname', 'otherNames', 'institution', 
    'courseOfStudy', 'gender', 'phone', 'residentialAddress', 'posting', 
    'region', 'district', 'nextOfKinName', 'nextOfKinPhone', 'isEmployed'
];
const optionalHeaders = ['gpsAddress'];


export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
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
        
        const actualHeaders = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          setError(`The CSV file is missing required columns: ${missingHeaders.join(', ')}`);
          setIsUploading(false);
          return;
        }

        let processedCount = 0;
        for (const row of rows) {
          if (row.nssNumber && row.surname && row.otherNames) {
            try {
              const DISTRICT_ID = 'district1';
              await createNewNSP(firestore, { 
                ...row,
                districtId: DISTRICT_ID,
                isEmployed: row.isEmployed.toLowerCase() === 'yes',
                gpsAddress: row.gpsAddress || '',
                year: selectedYear,
                batch: selectedBatch
              });
            } catch (err: any) {
              console.error(`Failed to upload record for ${row.surname}:`, err);
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
    const csvHeaders = [...requiredHeaders, ...optionalHeaders].join(',');
    const exampleData = [
        'test@example.com', 'NSS123456', 'Doe', 'John', 'University of Ghana', 'Computer Science', 
        'Male', '1234567890', '123 Faux Street', 'District Assembly', 'Greater Accra', 'Accra', 
        'Jane Doe', '0987654321', 'no', 'GA-123-4567'
    ].join(',');
    const csvContent = `${csvHeaders}\n${exampleData}`;
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
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload NSP Records</CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple NSP records at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Serving Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isUploading}>
                  <SelectTrigger><SelectValue placeholder="Select serving year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2026/2027">2026/2027</SelectItem>
                    <SelectItem value="2027/2028">2027/2028</SelectItem>
                    <SelectItem value="2028/2029">2028/2029</SelectItem>
                    <SelectItem value="2029/2030">2029/2030</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Batch Category</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={isUploading}>
                  <SelectTrigger><SelectValue placeholder="Select batch category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="University">University</SelectItem>
                    <SelectItem value="Teachers">Teachers</SelectItem>
                    <SelectItem value="Nurses">Nurses</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full items-center gap-2 pt-2">
            <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isUploading} className="h-9"/>
            <Button onClick={handleUpload} disabled={!file || isUploading || !selectedYear || !selectedBatch} size="sm" className="w-full sm:w-auto shrink-0">
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
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground sm:columns-2">
                    {requiredHeaders.map(h => <li key={h}><code className="font-semibold text-foreground">{h}</code></li>)}
                </ul>
            </div>
             <div>
                <h4 className="font-medium">Optional Columns</h4>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {optionalHeaders.map(h => <li key={h}><code className="font-semibold text-foreground">{h}</code></li>)}
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
