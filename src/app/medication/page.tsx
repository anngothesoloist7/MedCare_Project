"use client";

/**
 * Medication Tracking and Update Page Component
 *
 * This page allows doctors to track medication usage and manage medication inventory.
 * It features a split layout: 50% for medication tracking (charts and tables) and
 * 50% for medication create/update form.
 *
 * Connected to:
 * - Clerk authentication via useUser() hook to get current user
 * - API endpoint: GET /api/users/me to verify doctor role
 * - API endpoint: GET /api/medications/top-5 to fetch top medications
 * - API endpoint: GET /api/medications/low-stock to fetch low stock medications
 * - API endpoint: GET /api/medications to fetch all medications for dropdown
 * - API endpoint: POST /api/medications/manage to create/update medications
 *
 * Features:
 * - Role-based access control (only doctors can access)
 * - Bar chart showing top 5 medications by usage
 * - Low stock warning table showing 5 medications with lowest stock
 * - Form to create new medications or update existing ones
 * - Form validation and error handling
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangleIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/**
 * Type definition for top medication data from API
 */
type TopMedication = {
  medication_id: number;
  name: string;
  usage_count: number;
};

/**
 * Type definition for low stock medication data from API
 */
type LowStockMedication = {
  medication_id: number;
  name: string;
  stock_quantity: number;
  unit_price: number;
};

/**
 * Type definition for medication data from API (for dropdown)
 */
type Medication = {
  medication_id: number;
  name: string;
  description: string | null;
  stock_quantity: number;
  unit_price: number;
  created_at: Date;
  updated_at: Date;
};

/**
 * Main medication page component
 * Handles role check, data fetching, and medication management
 */
export default function MedicationPage() {
  const { isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  // Role check state
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);

  // Top medications state
  const [topMedications, setTopMedications] = useState<TopMedication[]>([]);
  const [isLoadingTopMedications, setIsLoadingTopMedications] = useState(false);

  // Low stock medications state
  const [lowStockMedications, setLowStockMedications] = useState<
    LowStockMedication[]
  >([]);
  const [isLoadingLowStock, setIsLoadingLowStock] = useState(false);

  // All medications state (for dropdown)
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState(false);

  // Form state
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<
    number | null
  >(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Check if current user is a doctor
   * Redirects to home page if not a doctor
   */
  useEffect(() => {
    const checkRole = async () => {
      if (!isUserLoaded) return;

      try {
        const response = await fetch("/api/users/me");
        const data = await response.json();

        if (response.ok && data.data?.role === "Doctor") {
          setIsDoctor(true);
        } else {
          // Not a doctor, redirect to home
          toast.error("Only doctors can access this page");
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking role:", error);
        toast.error("Failed to verify user role");
        router.push("/");
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkRole();
  }, [isUserLoaded, router]);

  /**
   * Load top 5 medications on component mount
   */
  useEffect(() => {
    const loadTopMedications = async () => {
      if (!isDoctor) return;

      setIsLoadingTopMedications(true);
      try {
        const response = await fetch("/api/medications/top-5");
        const data = await response.json();

        if (response.ok && data.data) {
          setTopMedications(data.data);
        } else {
          toast.error("Failed to load top medications");
        }
      } catch (error) {
        console.error("Error loading top medications:", error);
        toast.error("Failed to load top medications");
      } finally {
        setIsLoadingTopMedications(false);
      }
    };

    loadTopMedications();
  }, [isDoctor]);

  /**
   * Load low stock medications on component mount
   */
  useEffect(() => {
    const loadLowStockMedications = async () => {
      if (!isDoctor) return;

      setIsLoadingLowStock(true);
      try {
        const response = await fetch("/api/medications/low-stock");
        const data = await response.json();

        if (response.ok && data.data) {
          setLowStockMedications(data.data);
        } else {
          toast.error("Failed to load low stock medications");
        }
      } catch (error) {
        console.error("Error loading low stock medications:", error);
        toast.error("Failed to load low stock medications");
      } finally {
        setIsLoadingLowStock(false);
      }
    };

    loadLowStockMedications();
  }, [isDoctor]);

  /**
   * Load all medications for dropdown on component mount
   */
  useEffect(() => {
    const loadMedications = async () => {
      if (!isDoctor) return;

      setIsLoadingMedications(true);
      try {
        const response = await fetch("/api/medications");
        const data = await response.json();

        if (response.ok && data.data) {
          setMedications(data.data);
        } else {
          toast.error("Failed to load medications");
        }
      } catch (error) {
        console.error("Error loading medications:", error);
        toast.error("Failed to load medications");
      } finally {
        setIsLoadingMedications(false);
      }
    };

    loadMedications();
  }, [isDoctor]);

  /**
   * Handle medication selection for update mode
   * Pre-populates form with selected medication data
   */
  useEffect(() => {
    if (isUpdate && selectedMedicationId) {
      const medication = medications.find(
        (m) => m.medication_id === selectedMedicationId
      );
      if (medication) {
        setName(medication.name);
        setDescription(medication.description ?? "");
        setStockQuantity(medication.stock_quantity.toString());
        setUnitPrice(medication.unit_price.toString());
      }
    } else if (!isUpdate) {
      // Reset form when switching to create mode
      setName("");
      setDescription("");
      setStockQuantity("");
      setUnitPrice("");
      setSelectedMedicationId(null);
    }
  }, [isUpdate, selectedMedicationId, medications]);

  /**
   * Prepare chart data for bar chart
   * Transforms topMedications array into format expected by recharts
   */
  const chartData = topMedications.map((med) => ({
    name: med.name,
    usage: med.usage_count,
  }));

  /**
   * Chart configuration for shadcn chart component
   * Defines the data key and styling for the bar chart
   */
  const chartConfig = {
    usage: {
      label: "Usage count",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  /**
   * Handle form submission
   * Creates new medication or updates existing one based on isUpdate flag
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    // Name and description are only required for create mode
    if (!isUpdate && !name.trim()) {
      toast.error("Please enter medication name");
      return;
    }

    if (!stockQuantity.trim()) {
      toast.error("Please enter stock quantity");
      return;
    }

    if (!unitPrice.trim()) {
      toast.error("Please enter unit price");
      return;
    }

    const stockQty = parseInt(stockQuantity, 10);
    const unitPrc = parseFloat(unitPrice);

    if (isNaN(stockQty) || stockQty < 0) {
      toast.error("Stock quantity must be a valid non-negative number");
      return;
    }

    if (isNaN(unitPrc) || unitPrc < 0) {
      toast.error("Unit price must be a valid non-negative number");
      return;
    }

    if (isUpdate && !selectedMedicationId) {
      toast.error("Please select a medication to update");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/medications/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicationId: selectedMedicationId ?? undefined,
          // Only include name and description for create mode
          name: isUpdate ? undefined : name.trim(),
          description: isUpdate ? undefined : description.trim() || undefined,
          stockQuantity: stockQty,
          unitPrice: unitPrc,
          isUpdate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isUpdate
            ? "Medication updated successfully"
            : "Medication created successfully"
        );
        // Reset form
        setName("");
        setDescription("");
        setStockQuantity("");
        setUnitPrice("");
        setSelectedMedicationId(null);
        setIsUpdate(false);
        // Reload data
        const [topResponse, lowStockResponse, medicationsResponse] =
          await Promise.all([
            fetch("/api/medications/top-5"),
            fetch("/api/medications/low-stock"),
            fetch("/api/medications"),
          ]);
        const topData = await topResponse.json();
        const lowStockData = await lowStockResponse.json();
        const medicationsData = await medicationsResponse.json();
        if (topData.success) setTopMedications(topData.data);
        if (lowStockData.success) setLowStockMedications(lowStockData.data);
        if (medicationsData.success) setMedications(medicationsData.data);
      } else {
        toast.error(data.message ?? "Failed to save medication");
      }
    } catch (error) {
      console.error("Error saving medication:", error);
      toast.error("Failed to save medication");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking role
  if (isCheckingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not a doctor (will redirect)
  if (!isDoctor) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Medication management</h1>
        <p className="text-muted-foreground mt-2">
          Track medication usage and manage inventory
        </p>
      </div>

      {/* Split layout: 50/50 */}
      <div className="flex gap-6">
        {/* Left side: Medication Tracking (50%) */}
        <div className="flex w-1/2 flex-col gap-6">
          {/* Top 5 Medications Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 medications</CardTitle>
              <CardDescription>
                Most prescribed medications by usage count
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTopMedications ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No medication usage data available
                </div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      top: 40,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) =>
                        value.length > 15 ? `${value.slice(0, 15)}...` : value
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="usage" fill="var(--color-usage)" radius={8}>
                      <LabelList
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Warning Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock warnings</CardTitle>
              <CardDescription>
                5 medications with lowest stock quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLowStock ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  Loading stock data...
                </div>
              ) : lowStockMedications.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No medication data available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800">
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Medication name
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Stock quantity
                        </th>
                        <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
                          Unit price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockMedications.map((med) => (
                        <tr
                          key={med.medication_id}
                          className={
                            med.stock_quantity < 10
                              ? "bg-red-50 dark:bg-red-900/20"
                              : ""
                          }
                        >
                          <td className="border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
                            {med.name}
                          </td>
                          <td className="border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
                            <div className="flex items-center gap-2">
                              {med.stock_quantity < 10 && (
                                <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                              )}
                              <span
                                className={
                                  med.stock_quantity < 10
                                    ? "font-semibold text-red-600 dark:text-red-400"
                                    : ""
                                }
                              >
                                {med.stock_quantity}
                              </span>
                            </div>
                          </td>
                          <td className="border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
                            $
                            {typeof med.unit_price === "string"
                              ? parseFloat(med.unit_price).toFixed(2)
                              : med.unit_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right side: Medication Update Form (50%) */}
        <div className="w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Create or update medication</CardTitle>
              <CardDescription>
                Add new medications or update existing stock quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Toggle between create and update mode */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!isUpdate ? "default" : "outline"}
                    onClick={() => setIsUpdate(false)}
                    className="flex-1"
                  >
                    Create new
                  </Button>
                  <Button
                    type="button"
                    variant={isUpdate ? "default" : "outline"}
                    onClick={() => setIsUpdate(true)}
                    className="flex-1"
                  >
                    Update existing
                  </Button>
                </div>

                {/* Medication selection dropdown (only shown in update mode) */}
                {isUpdate && (
                  <div className="space-y-2">
                    <Label htmlFor="medication-select">
                      Select medication to update
                    </Label>
                    <Select
                      value={selectedMedicationId?.toString() ?? ""}
                      onValueChange={(value) =>
                        setSelectedMedicationId(
                          value ? parseInt(value, 10) : null
                        )
                      }
                    >
                      <SelectTrigger id="medication-select">
                        <SelectValue placeholder="Select a medication" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingMedications ? (
                          <SelectItem value="loading" disabled>
                            Loading medications...
                          </SelectItem>
                        ) : medications.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No medications available
                          </SelectItem>
                        ) : (
                          medications.map((med) => (
                            <SelectItem
                              key={med.medication_id}
                              value={med.medication_id.toString()}
                            >
                              {med.name} (Stock: {med.stock_quantity})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Medication name - only shown in create mode */}
                {!isUpdate && (
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Medication name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter medication name"
                      required
                    />
                  </div>
                )}

                {/* Description - only shown in create mode */}
                {!isUpdate && (
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter medication description (optional)"
                      rows={3}
                    />
                  </div>
                )}

                {/* Stock quantity */}
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">
                    Stock quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="Enter stock quantity"
                    required
                  />
                </div>

                {/* Unit price */}
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">
                    Unit price ($) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="Enter unit price"
                    required
                  />
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isUpdate
                    ? "Update medication"
                    : "Create medication"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
