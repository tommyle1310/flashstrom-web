"use client";
import { SimplePagination } from "@/components/ui/pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { useEffect, useState, useRef } from "react";
import { Eye, Power, Trash, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  TableHeader,
  TableBody,
  Table,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Spinner } from "@/components/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEpochToExactTime } from "@/utils/functions/formatTime";
import IdCell from "@/components/IdCell";
import { customerService } from "@/services/companion-admin/customerService";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FallbackImage from "@/components/FallbackImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axios";
import { userSearchService } from "@/services/user/userSearchService";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: { city: string; street: string }[];
  avatar: { url: string; key: string };
  user: {
    email: string;
  };
  last_login: number;
  is_banned: boolean;
}

interface OrderItem {
  name: string;
  item_id: string;
  quantity: number;
  variant_id: string;
  price_at_time_of_order: number;
  item?: {
    id: string;
    name: string;
    price: string;
    avatar?: {
      key: string;
      url: string;
    };
  };
}

interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  driver_id: string;
  distance: string;
  status: string;
  total_amount: string;
  delivery_fee: string;
  payment_status: string;
  payment_method: string;
  customer_location: string;
  restaurant_location: string;
  order_items: OrderItem[];
  customer_note: string;
  restaurant_note: string;
  order_time: string;
  delivery_time: string;
  tracking_info: string;
  updated_at: number;
  cancelled_by: string | null;
  cancelled_by_id: string | null;
  cancellation_reason: string | null;
  cancellation_title: string | null;
  cancellation_description: string | null;
  cancelled_at: string | null;
  restaurant: {
    id: string;
    address_id: string;
    restaurant_name: string;
    avatar?: {
      key: string;
      url: string;
    };
  };
}

interface ComplaintHistory {
  id: string;
  customer_id: string;
  assignee_type: string;
  subject: string;
  description: string;
  issue_type: string;
  status: string;
  priority: string;
  resolution_type: string | null;
  resolution_notes: string | null;
  created_at: number;
  updated_at: number;
  resolved_at: number | null;
  first_response_at: number | null;
  last_response_at: number | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: {
      key: string;
      url: string;
    };
  };
  assigned_customer_care?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: {
      key: string;
      url: string;
    };
  };
  order?: {
    id: string;
    status: string;
    total_amount: string;
    order_items: OrderItem[];
  };
}

const Page = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customersSearchResult, setCustomersSearchResult] = useState<
    Customer[]
  >([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isOrderHistoryDialogOpen, setIsOrderHistoryDialogOpen] =
    useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isOrderHistoryLoading, setIsOrderHistoryLoading] = useState(false);
  const [isComplaintHistoryDialogOpen, setIsComplaintHistoryDialogOpen] =
    useState(false);
  const [customerComplaints, setCustomerComplaints] = useState<
    ComplaintHistory[]
  >([]);
  const [isComplaintHistoryLoading, setIsComplaintHistoryLoading] =
    useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [isBanLoading, setIsBanLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchCustomers();

    // Set up 30-second polling for live updates
    const pollInterval = setInterval(() => {
      console.log("🔄 Polling customers data...");
      fetchCustomersForPolling();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [currentPage]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await customerService.findAllPaginated(10, currentPage);
      console.log("hceck res", response);
      if (response.EC === 0) {
        const {
          totalItems: items,
          totalPages: pages,
          items: customerItems,
        } = response.data;
        setCustomers(customerItems);
        setTotalItems(items);
        setTotalPages(pages);
      } else {
        console.error("API error:", response.EM);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
    setIsLoading(false);
  };

  const fetchCustomersForPolling = async () => {
    try {
      const response = await customerService.findAllPaginated(10, currentPage);
      if (response.EC === 0) {
        const {
          totalItems: items,
          totalPages: pages,
          items: customerItems,
        } = response.data;
        setCustomers(customerItems);
        setTotalItems(items);
        setTotalPages(pages);
      } else {
        console.error("API error:", response.EM);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter(
      (c) =>
        !c.is_banned &&
        !(Math.floor(Date.now() / 1000) - c.last_login > 2592000)
    ).length;
    const bannedCount = customers.filter((c) => c.is_banned).length;

    setStats({
      total: totalCount,
      active: activeCount,
      inactive: bannedCount,
    });
  }, [customers]);

  // const handleGenerateCustomer = async () => {
  //   setIsLoading(true);
  //   const result = await customerService.createCustomer();
  //   setIsLoading(false);
  //   if (result && result.EC === 0) {
  //     fetchCustomers();
  //   }
  // };

  const handleStatusChange = async (customerId: string, shouldBan: boolean) => {
    if (shouldBan) {
      setSelectedCustomerId(customerId);
      setIsBanDialogOpen(true);
      return;
    }

    // try {
    //   setIsLoading(true);
    //   // const result = await customerService.updateCustomerStatus(customerId, shouldBan);
    //   if (result && result.EC === 0) {
    //     setCustomers((prevCustomers) =>
    //       prevCustomers.map((customer) =>
    //         customer.id === customerId
    //           ? { ...customer, is_banned: shouldBan }
    //           : customer
    //       )
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error updating customer status:", error);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    setIsOrderHistoryLoading(true);
    try {
      const response = await customerService.getCustomerOrders(customerId);
      console.log("cehc kres data", response);

      const { EC, data } = response;
      if (EC === 0) {
        console.log("check bla", EC, data);
        setCustomerOrders(data);
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    }
    setIsOrderHistoryLoading(false);
  };

  const handleViewOrderHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsOrderHistoryDialogOpen(true);
    fetchCustomerOrders(customer.id);
  };

  const fetchCustomerComplaints = async (customerId: string) => {
    setIsComplaintHistoryLoading(true);
    try {
      const response = await customerService.findAllComplaintHistory(
        customerId
      );
      if (response.EC === 0) {
        setCustomerComplaints(response.data);
      }
    } catch (error) {
      console.error("Error fetching customer complaints:", error);
    }
    setIsComplaintHistoryLoading(false);
  };

  const handleViewComplaintHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsComplaintHistoryDialogOpen(true);
    fetchCustomerComplaints(customer.id);
  };

  const handleBanSubmit = async () => {
    if (!selectedCustomerId || !banReason.trim()) return;

    try {
      setIsBanLoading(true);
      const response = await axiosInstance.post(
        `admin/ban/Customer/${selectedCustomerId}`,
        { reason: banReason }
      );

      if (response.data.EC === 0) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.id === selectedCustomerId
              ? {
                  ...customer,
                  is_banned: true,
                }
              : customer
          )
        );
        setIsBanDialogOpen(false);
        setBanReason("");
        setSelectedCustomerId(null);
      }
    } catch (error) {
      console.error("Error banning customer:", error);
    } finally {
      setIsBanLoading(false);
    }
  };

  const columns: ColumnDef<Customer>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "user.email",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex flex-row items-center gap-2">
            <FallbackImage
              src={customer?.avatar?.url}
              alt="avatar"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
            <span>{customer?.user?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-center">
            {customer.first_name} {customer.last_name}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original;
        console.log(
          "check cus",
          Math.floor(Date.now() / 1000) - customer.last_login > 2592000
        );
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
              ${
                customer.is_banned
                  ? "bg-red-100 text-red-800"
                  : Math.floor(Date.now() / 1000) - customer.last_login >
                    2592000
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {customer.is_banned
                ? "Banned"
                : Math.floor(Date.now() / 1000) - customer.last_login > 2592000
                ? "Inactive"
                : "Active"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-full p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="grid gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleViewOrderHistory(customer)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Orders History
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleViewComplaintHistory(customer)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Complaint History
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() =>
                    handleStatusChange(customer.id, !customer.is_banned)
                  }
                >
                  <Power className="mr-2 h-4 w-4" />
                  {Math.floor(Date.now() / 1000) - customer.last_login > 2592000
                    ? "Ban"
                    : "Activate"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const handleSearch = async (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setCustomersSearchResult([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await userSearchService.searchUsers(query, "customer");
        if (response.EC === 0) {
          // Convert UserSearchResult to Customer type
          const convertedResults: Customer[] = response.data.results.map(
            (user) => ({
              id: user.id,
              first_name: user.first_name || "",
              last_name: user.last_name || "",
              email: user.email || "",
              phone_number: "",
              address: [],
              avatar: user.avatar || { url: "", key: "" },
              user: {
                email: user.user_email || "",
              },
              last_login: user.last_login
                ? Math.floor(new Date(user.last_login).getTime() / 1000)
                : 0,
              is_banned: false,
            })
          );
          setCustomersSearchResult(convertedResults);
        } else {
          setCustomersSearchResult([]);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
        setCustomersSearchResult([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const table = useReactTable({
    data: searchQuery ? customersSearchResult : customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      console.log("Changing to page:", page);
      setCurrentPage(page);
    }
  };

  console.log(
    "checl priceaitorder",
    typeof +customerOrders?.[3]?.order_items?.[0]?.price_at_time_of_order,
    +customerOrders
  );

  return (
    <div className="p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="text-primary-600 max-md:text-xs font-bold"
              href="/"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-primary-600 max-md:text-xs font-bold" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary-600 max-md:text-xs font-bold">
              Customers
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Customers</h2>
          <div className="text-3xl font-bold text-blue-600">{totalItems}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Active Customers</h2>
          <div className="text-3xl font-bold text-green-600">
            {stats.active}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Banned Customers</h2>
          <div className="text-3xl font-bold text-red-600">
            {stats.inactive}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="justify-between flex items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">Customer List</h2>
          <div className="self-end relative">
            <Input
              className="w-72"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            )}
          </div>
          {/* <Button onClick={handleGenerateCustomer}>Generate Customer</Button> */}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <Dialog
        open={isOrderHistoryDialogOpen}
        onOpenChange={setIsOrderHistoryDialogOpen}
      >
        <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Order History</DialogTitle>
            <DialogDescription>
              View order history for {selectedCustomer?.first_name}{" "}
              {selectedCustomer?.last_name}
            </DialogDescription>
          </DialogHeader>
          <Spinner isVisible={isOrderHistoryLoading} isOverlay />

          <div className="space-y-4">
            {customerOrders.map((order) => {
              const totalItems = order.order_items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              const totalAmount = order.order_items.reduce(
                (sum, item) =>
                  sum + item.price_at_time_of_order * item.quantity,
                0
              );

              return (
                <Accordion type="single" collapsible key={order.id}>
                  <AccordionItem value={order.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${
                                order.status === "DELIVERED"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-sm font-medium">
                            ${totalAmount.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {totalItems} items
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatEpochToExactTime(Number(order.order_time))}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card>
                        <CardHeader>
                          <CardTitle>Order Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Order ID</p>
                            <IdCell id={order.id} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${
                                  order.status === "DELIVERED"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Total Amount</p>
                            <p className="text-sm text-muted-foreground">
                              ${totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Delivery Fee</p>
                            <p className="text-sm text-muted-foreground">
                              ${order.delivery_fee}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Payment Status
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.payment_status}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Payment Method
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.payment_method}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Order Time</p>
                            <p className="text-sm text-muted-foreground">
                              {formatEpochToExactTime(Number(order.order_time))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Delivery Time</p>
                            <p className="text-sm text-muted-foreground">
                              {formatEpochToExactTime(
                                Number(order.delivery_time)
                              )}
                            </p>
                          </div>
                        </CardContent>

                        <CardHeader>
                          <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {order.order_items.map(
                            (item: OrderItem, index: number) => (
                              <div
                                key={index}
                                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white rounded-md border hover:shadow-md transition-shadow"
                              >
                                {item?.item?.avatar ? (
                                  <FallbackImage
                                    src={item.item.avatar.url}
                                    alt={`${item.name} avatar`}
                                    width={48}
                                    height={48}
                                    className="rounded-sm aspect-square object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs">
                                    No Image
                                  </div>
                                )}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">
                                      {item.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Price: $
                                      {
                                        +(+item?.price_at_time_of_order)?.toFixed(
                                          2
                                        )
                                      }{" "}
                                      x {item.quantity}
                                    </p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-500">
                                        Item ID
                                      </p>
                                      <IdCell id={item.item_id} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-500">
                                        Variant ID
                                      </p>
                                      <IdCell id={item.variant_id} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </CardContent>

                        <CardHeader>
                          <CardTitle>Restaurant Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-4">
                            {order.restaurant?.avatar && (
                              <FallbackImage
                                src={order.restaurant.avatar.url}
                                alt="Restaurant Avatar"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">Name</p>
                              <p className="text-sm text-muted-foreground">
                                {order.restaurant?.restaurant_name}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Restaurant ID</p>
                            <p className="text-sm text-muted-foreground">
                              {order.restaurant?.id}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isComplaintHistoryDialogOpen}
        onOpenChange={setIsComplaintHistoryDialogOpen}
      >
        <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Complaint History</DialogTitle>
            <DialogDescription>
              View complaint history for {selectedCustomer?.first_name}{" "}
              {selectedCustomer?.last_name}
            </DialogDescription>
          </DialogHeader>
          <Spinner isVisible={isComplaintHistoryLoading} isOverlay />

          <div className="space-y-4">
            {customerComplaints.map((complaint) => (
              <Accordion type="single" collapsible key={complaint.id}>
                <AccordionItem value={complaint.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              complaint.status === "RESOLVED"
                                ? "bg-green-100 text-green-800"
                                : complaint.status === "OPEN"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {complaint.status}
                        </span>
                        <span className="text-sm font-medium">
                          {complaint.subject}
                        </span>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              complaint.priority === "HIGH"
                                ? "bg-red-100 text-red-800"
                                : complaint.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                        >
                          {complaint.priority}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatEpochToExactTime(complaint.created_at)}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardHeader>
                        <CardTitle>Complaint Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Complaint ID</p>
                          <IdCell id={complaint.id} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${
                                complaint.status === "RESOLVED"
                                  ? "bg-green-100 text-green-800"
                                  : complaint.status === "OPEN"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {complaint.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Subject</p>
                          <p className="text-sm text-muted-foreground">
                            {complaint.subject}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Description</p>
                          <p className="text-sm text-muted-foreground">
                            {complaint.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Issue Type</p>
                          <p className="text-sm text-muted-foreground">
                            {complaint.issue_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Priority</p>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${
                                complaint.priority === "HIGH"
                                  ? "bg-red-100 text-red-800"
                                  : complaint.priority === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {complaint.priority}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Created At</p>
                          <p className="text-sm text-muted-foreground">
                            {formatEpochToExactTime(complaint.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Updated At</p>
                          <p className="text-sm text-muted-foreground">
                            {formatEpochToExactTime(complaint.updated_at)}
                          </p>
                        </div>
                        {complaint.resolved_at && (
                          <div>
                            <p className="text-sm font-medium">Resolved At</p>
                            <p className="text-sm text-muted-foreground">
                              {formatEpochToExactTime(complaint.resolved_at)}
                            </p>
                          </div>
                        )}
                        {complaint.resolution_notes && (
                          <div>
                            <p className="text-sm font-medium">
                              Resolution Notes
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {complaint.resolution_notes}
                            </p>
                          </div>
                        )}
                      </CardContent>

                      {complaint.order && (
                        <>
                          <CardHeader>
                            <CardTitle>Related Order</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Order ID</p>
                              <IdCell id={complaint.order.id} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${
                                    complaint.order.status === "DELIVERED"
                                      ? "bg-green-100 text-green-800"
                                      : complaint.order.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {complaint.order.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Total Amount
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${complaint.order.total_amount}
                              </p>
                            </div>
                          </CardContent>
                        </>
                      )}

                      {complaint.assigned_customer_care && (
                        <CardHeader>
                          <CardTitle>Assigned Customer Care</CardTitle>
                          <CardContent className="flex items-center gap-4">
                            {complaint.assigned_customer_care.avatar && (
                              <FallbackImage
                                src={
                                  complaint.assigned_customer_care.avatar.url
                                }
                                alt="Customer Care Avatar"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">Name</p>
                              <p className="text-sm text-muted-foreground">
                                {complaint.assigned_customer_care.first_name}{" "}
                                {complaint.assigned_customer_care.last_name}
                              </p>
                            </div>
                          </CardContent>
                        </CardHeader>
                      )}
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Ban Customer</DialogTitle>
            <DialogDescription>
              Please provide a reason for banning this customer. This will be
              recorded for administrative purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Ban Reason</Label>
              <Input
                id="reason"
                placeholder="Enter the reason for banning..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsBanDialogOpen(false);
                setBanReason("");
                setSelectedCustomerId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBanSubmit}
              disabled={!banReason.trim() || isBanLoading}
            >
              {isBanLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                "Ban Customer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
