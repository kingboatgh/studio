import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileDown, FileText } from "lucide-react";

export default function BulkUploadPage() {
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
            <Input type="file" accept=".csv" />
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
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
                <Button variant="outline" size="sm">
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
                        <pre className="mt-1 text-xs"><code>serviceNumber,fullName,institution,posting<br/>NSS123456,John Doe,University of Ghana,District Assembly</code></pre>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
