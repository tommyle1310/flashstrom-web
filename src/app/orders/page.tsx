"use client";
import React, { useEffect, useState } from "react";
import { Eye, XCircle, MoreHorizontal, Trash, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
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
import Image from "next/image";
import { Order } from "@/types/orders";
import { orderService } from "@/services/order/orderService";
import { formatEpochToExactTime } from "@/utils/functions/formatTime";
import IdCell from "@/components/IdCell";
import { SimplePagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Page = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
    cancelled: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.findAllPaginated(10, currentPage);
      const { EC, data } = response;
      if (EC === 0) {
        setOrders(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);

        // Calculate stats based on order status
        const deliveredCount = data.items.filter(
          (order: Order) => order.status === "DELIVERED"
        ).length;
        const pendingCount = data.items.filter(
          (order: Order) => order.status === "PENDING"
        ).length;
        const cancelledCount = data.items.filter(
          (order: Order) => order.status === "CANCELLED"
        ).length;

        setStats({
          total: data.totalItems,
          delivered: deliveredCount,
          pending: pendingCount,
          cancelled: cancelledCount,
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteOrder = (orderId: string) => {
    setDeletingOrderId(orderId);
    setIsDeleting(true);
    setTimeout(() => {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setIsDeleting(false);
      setDeletingOrderId(null);
    }, 1500);
  };

  const fetchOrderDetails = async (orderId: string) => {
    setIsDialogLoading(true);
    try {
      const response = await orderService.findOrderById(orderId);
      const { EC, data } = response;
      if (EC === 0) {
        setSelectedOrder(data);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
    setIsDialogLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const columns: ColumnDef<Order>[] = [
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
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          className="text-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return <IdCell id={id} />;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          className="text-center w-full"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="text-center">
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${
                  status === "DELIVERED"
                    ? "bg-green-100 text-green-800"
                    : status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
            >
              {status}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => (
        <Button
          className="text-center w-full"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center text-sm font-thin">
          ${Number(row.getValue("total_amount")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "order_time",
      header: ({ column }) => (
        <Button
          className="text-center w-full"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center text-sm font-thin">
          {formatEpochToExactTime(row.getValue("order_time"))}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        if (isDeleting && deletingOrderId === order.id) {
          return (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          );
        }
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-full p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32">
              <div className="grid gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => fetchOrderDetails(order.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Details
                </Button>
                {order.status !== "DELIVERED" &&
                  order.cancelled_at === null && (
                    <Button
                      variant="ghost"
                      className="flex items-center justify-start text-destructive"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  console.log("cehck waht avat", selectedOrder?.order_items);

  return (
    <div className="p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <Breadcrumb>
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
              Orders
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-md font-semibold mb-2">Total Orders</h2>
          <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-md font-semibold mb-2">Delivered Orders</h2>
          <div className="text-2xl font-bold text-green-600">
            {stats.delivered}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-md font-semibold mb-2">Pending Orders</h2>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-md font-semibold mb-2">Cancelled Orders</h2>
          <div className="text-2xl font-bold text-red-600">
            {stats.cancelled}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="justify-between flex items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Order List</h2>
            <span className="text-primary-500">({totalItems})</span>
          </div>
          <div className="self-end ml-4">
            <Input className="w-72" placeholder="Search" />
          </div>
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View detailed information about the order.
            </DialogDescription>
          </DialogHeader>
          <Spinner isVisible={isDialogLoading} isOverlay />
          {selectedOrder && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Order ID</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          selectedOrder.status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : selectedOrder.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Amount</p>
                    <p className="text-sm text-muted-foreground">
                      ${Number(selectedOrder.total_amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delivery Fee</p>
                    <p className="text-sm text-muted-foreground">
                      ${selectedOrder.delivery_fee}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Service Fee</p>
                    <p className="text-sm text-muted-foreground">
                      ${selectedOrder.service_fee}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Status</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.payment_status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.payment_method}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Order Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        Number(selectedOrder.order_time) * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delivery Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        Number(selectedOrder.delivery_time) * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Customer Note</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.customer_note || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Restaurant Note</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.restaurant_note || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedOrder.order_items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-white rounded-md border hover:shadow-md transition-shadow"
                    >
                      {item?.item.avatar ? (
                        <Image
                          src={item?.item.avatar.url}
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
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Price: $
                            {Number(item.price_at_time_of_order).toFixed(2)} x{" "}
                            {item.quantity}
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
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4">
                    {selectedOrder.customer?.avatar && (
                      <Image
                        src={selectedOrder.customer.avatar.url}
                        alt="Customer Avatar"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.customer?.first_name}{" "}
                        {selectedOrder.customer?.last_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Customer ID</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.customer?.id}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4">
                    {selectedOrder.restaurant?.avatar && (
                      <Image
                        src={selectedOrder.restaurant.avatar.url}
                        alt="Restaurant Avatar"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.restaurant?.restaurant_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Restaurant ID</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.restaurant?.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact Email</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.restaurant?.contact_email?.[0]?.email ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.restaurant?.contact_phone?.[0]?.number ||
                        "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Driver Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4">
                    {selectedOrder.driver?.avatar && (
                      <Image
                        src={selectedOrder.driver.avatar.url}
                        alt="Driver Avatar"
                        width={40}
                        height={40}
                        className="rounded-full aspect-square"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.driver?.first_name}{" "}
                        {selectedOrder.driver?.last_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Driver ID</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.driver?.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vehicle</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.driver?.vehicle
                        ? `${selectedOrder.driver.vehicle.year} ${selectedOrder.driver.vehicle.brand} ${selectedOrder.driver.vehicle.model}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact Email</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.driver?.contact_email?.[0]?.email || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
