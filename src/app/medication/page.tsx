"use client";

/**
 * Medication Tracking and Update Page Component
 *
 * This page allows doctors to track medication usage and manage medication inventory.
 * It features a tabbed interface with three sections: Track (charts), Create (form), and Update (form).
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
 * - Track tab: Bar chart showing top 5 medications by usage and stock warning bar chart
 * - Create tab: Form to create new medications
 * - Update tab: Form to update existing medications
 * - Form validation and error handling
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChartIcon, PlusIcon, PencilIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("track");
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
          toast.error("404 Not Found");
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
    if (activeTab === "update" && selectedMedicationId) {
      const medication = medications.find(
        (m) => m.medication_id === selectedMedicationId
      );
      if (medication) {
        setName(medication.name);
        setDescription(medication.description ?? "");
        setStockQuantity(medication.stock_quantity.toString());
        setUnitPrice(medication.unit_price.toString());
      }
    } else if (activeTab === "create") {
      // Reset form when switching to create mode
      setName("");
      setDescription("");
      setStockQuantity("");
      setUnitPrice("");
      setSelectedMedicationId(null);
    }
  }, [activeTab, selectedMedicationId, medications]);

  /**
   * Prepare chart data for top medications bar chart
   * Transforms topMedications array into format expected by recharts
   */
  const topMedicationsChartData = topMedications.map((med) => ({
    name: med.name,
    usage: med.usage_count,
  }));

  /**
   * Prepare chart data for stock warning bar chart
   * Transforms lowStockMedications array into format expected by recharts vertical bar chart
   * Uses chart colors from globals.css (--chart-1 through --chart-5) based on index position
   * Creates a visually appealing gradient effect across the bars using theme colors
   */
  const stockWarningChartData = lowStockMedications.map((med, index) => {
    // Use chart colors from CSS variables (from lightest to darkest)
    // These colors are defined in globals.css and create a gradient effect
    const chartColors = [
      "var(--chart-1)", // #c6f8ff - Lightest
      "var(--chart-2)", // #aeeffc
      "var(--chart-3)", // #8fe3f8
      "var(--chart-4)", // #6ad3f2
      "var(--chart-5)", // #3fc0e8 - Darkest
    ];
    return {
      medication: med.name,
      stock: med.stock_quantity,
      fill: chartColors[index] ?? chartColors[chartColors.length - 1],
    };
  });

  /**
   * Chart configuration for top medications bar chart
   * Defines the data key and styling for the horizontal bar chart
   * Uses chart colors from globals.css for consistency
   */
  const topMedicationsChartConfig = {
    usage: {
      label: "Usage count",
      color: "var(--chart-5)", // Use darkest chart color for better visibility
    },
  } satisfies ChartConfig;

  /**
   * Prepare chart data for top medications with gradient colors
   * Uses chart colors from globals.css (--chart-1 through --chart-5)
   * Creates a gradient effect using theme colors from lightest to darkest
   */
  const topMedicationsChartDataWithColors = topMedicationsChartData.map(
    (item, index) => {
      // Use chart colors from CSS variables (from lightest to darkest)
      // These colors are defined in globals.css and create a gradient effect
      const chartColors = [
        "var(--chart-1)", // #c6f8ff - Lightest
        "var(--chart-2)", // #aeeffc
        "var(--chart-3)", // #8fe3f8
        "var(--chart-4)", // #6ad3f2
        "var(--chart-5)", // #3fc0e8 - Darkest
      ];
      return {
        ...item,
        fill: chartColors[index] ?? chartColors[chartColors.length - 1],
      };
    }
  );

  /**
   * Chart configuration for stock warning bar chart
   * Defines the data keys and styling for the vertical bar chart
   */
  const stockWarningChartConfig = {
    stock: {
      label: "Stock quantity",
    },
  } satisfies ChartConfig;

  /**
   * Handle form submission
   * Creates new medication or updates existing one based on activeTab state
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    // Name and description are only required for create mode
    if (activeTab === "create" && !name.trim()) {
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

    if (activeTab === "update" && !selectedMedicationId) {
      toast.error("Please select a medication to update");
      return;
    }

    const isUpdateMode = activeTab === "update";

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
          name: isUpdateMode ? undefined : name.trim(),
          description: isUpdateMode
            ? undefined
            : description.trim() || undefined,
          stockQuantity: stockQty,
          unitPrice: unitPrc,
          isUpdate: isUpdateMode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isUpdateMode
            ? "Medication updated successfully"
            : "Medication created successfully"
        );
        // Reset form
        setName("");
        setDescription("");
        setStockQuantity("");
        setUnitPrice("");
        setSelectedMedicationId(null);
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

      {/* Tabbed interface with Track, Create, and Update tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs list - horizontally centered */}
        {/* active tab uses chart-5 color */}
        <div className="flex justify-center mb-6">
          <TabsList className="bg-gray-200 border border-gray-200 rounded-lg">
            <TabsTrigger
              value="track"
              className="data-[state=active]:bg-gray-100 "
            >
              <BarChartIcon className="h-4 w-4" />
              Track
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gray-100"
            >
              <PlusIcon className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger
              value="update"
              className="data-[state=active]:bg-gray-100"
            >
              <PencilIcon className="h-4 w-4" />
              Update
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Track tab: Shows both charts */}
        <TabsContent value="track" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                ) : topMedicationsChartData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    No medication usage data available
                  </div>
                ) : (
                  <ChartContainer config={topMedicationsChartConfig}>
                    <BarChart
                      accessibilityLayer
                      data={topMedicationsChartDataWithColors}
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
                      <Bar dataKey="usage" radius={8}>
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

            {/* Stock Warning Bar Chart */}
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
                ) : stockWarningChartData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    No medication data available
                  </div>
                ) : (
                  <ChartContainer config={stockWarningChartConfig}>
                    <BarChart
                      accessibilityLayer
                      data={stockWarningChartData}
                      layout="vertical"
                      margin={{
                        left: 20,
                        right: 10,
                      }}
                    >
                      <YAxis
                        dataKey="medication"
                        type="category"
                        tickLine={false}
                        tickMargin={15}
                        axisLine={false}
                        width={150}
                        tickFormatter={(value) =>
                          value.length > 20 ? `${value.slice(0, 20)}...` : value
                        }
                      />
                      <XAxis dataKey="stock" type="number" hide />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="stock" layout="vertical" radius={5} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Create tab: Form to create new medications */}
        <TabsContent value="create">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Create medication</CardTitle>
                <CardDescription>
                  Add a new medication to the inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Medication name */}
                  <div className="space-y-2">
                    <Label htmlFor="name-create">
                      Medication name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name-create"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter medication name"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description-create">Description</Label>
                    <Textarea
                      id="description-create"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter medication description (optional)"
                      rows={3}
                    />
                  </div>

                  {/* Stock quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity-create">
                      Stock quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stockQuantity-create"
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
                    <Label htmlFor="unitPrice-create">
                      Unit price ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="unitPrice-create"
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
                    {isSubmitting ? "Creating..." : "Create medication"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Update tab: Form to update existing medications */}
        <TabsContent value="update">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Update medication</CardTitle>
                <CardDescription>
                  Update stock quantities and prices for existing medications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Medication selection dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="medication-select-update">
                      Select medication to update
                    </Label>
                    <Select
                      value={selectedMedicationId?.toString() ?? ""}
                      onValueChange={(value) => {
                        setSelectedMedicationId(
                          value ? parseInt(value, 10) : null
                        );
                      }}
                    >
                      <SelectTrigger id="medication-select-update">
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

                  {/* Stock quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity-update">
                      Stock quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stockQuantity-update"
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
                    <Label htmlFor="unitPrice-update">
                      Unit price ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="unitPrice-update"
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
                    disabled={isSubmitting || !selectedMedicationId}
                    className="w-full"
                  >
                    {isSubmitting ? "Updating..." : "Update medication"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
