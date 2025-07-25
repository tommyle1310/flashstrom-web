"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal, Plus, Edit, Trash } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axios from "axios";
import { Spinner } from "@/components/Spinner";
import { SimplePagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

// Định nghĩa type cho FAQ
interface AnswerItem {
  type: "text" | "image" | "image_row";
  value: string | { key: string; url: string } | { key: string; url: string }[];
}

interface FAQ {
  id: string;
  question: string;
  answer: AnswerItem[];
  type: "SERVICE" | "ACCOUNT" | "GENERAL" | "PAYMENT";
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  target_user: string[];
  created_by_id?: string;
  created_by?: { first_name: string; last_name: string };
  created_at: string;
  updated_at: string | null;
}

const Page = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [newFAQ, setNewFAQ] = useState<FAQ | null>(null);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openAdd, setOpenAdd] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchFAQs = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/faqs/paginated?page=${currentPage}&limit=10`
      );
      const { EC, data } = response.data;
      if (EC === 0 && data) {
        setFaqs(data.items);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [currentPage]);

  // Handle mở modal edit
  const handleEdit = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setOpenEdit(true);
  };

  // Handle mở modal add
  const handleOpenAdd = () => {
    setNewFAQ({
      id: "",
      question: "",
      answer: [{ type: "text", value: "" }],
      type: "GENERAL",
      status: "ACTIVE",
      target_user: ["CUSTOMER"],
      created_at: (Date.now() / 1000).toString(),
      updated_at: null,
    });
    setOpenAdd(true);
  };

  // Handle submit chỉnh sửa FAQ
  const handleSaveEdit = async () => {
    if (!selectedFAQ) return;
    setIsEditing(true);
    try {
      const response = await axiosInstance.patch(`/faqs/${selectedFAQ.id}`, {
        question: selectedFAQ.question,
        answer: selectedFAQ.answer,
        type: selectedFAQ.type,
        status: selectedFAQ.status,
        target_user: selectedFAQ.target_user,
      });
      const { EC } = response.data;
      if (EC === 0) {
        setOpenEdit(false);
        fetchFAQs();
        toast({
          title: "Success",
          description: "FAQ updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update FAQ.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Handle submit thêm FAQ mới
  const handleSaveAdd = async () => {
    if (!newFAQ) return;
    setIsAdding(true);
    try {
      const response = await axiosInstance.post("/faqs", {
        question: newFAQ.question,
        answer: newFAQ.answer,
        type: newFAQ.type,
        status: newFAQ.status,
        target_user: newFAQ.target_user,
      });
      const { EC } = response.data;
      if (EC === 0) {
        setOpenAdd(false);
        fetchFAQs();
        toast({
          title: "Success",
          description: "FAQ created successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create FAQ.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding FAQ:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle thay đổi giá trị trong form (edit)
  const handleChangeEdit = (field: keyof FAQ, value: string | string[]) => {
    setSelectedFAQ((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle thay đổi giá trị trong form (add)
  const handleChangeAdd = (field: keyof FAQ, value: string | string[]) => {
    setNewFAQ((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle thêm answer row
  const handleAddAnswerRow = (isEdit: boolean) => {
    const setter = isEdit ? setSelectedFAQ : setNewFAQ;
    setter((prev) =>
      prev
        ? { ...prev, answer: [...prev.answer, { type: "text", value: "" }] }
        : null
    );
  };

  // Handle xóa answer row
  const handleDeleteAnswerRow = (isEdit: boolean, index: number) => {
    const setter = isEdit ? setSelectedFAQ : setNewFAQ;
    setter((prev) =>
      prev
        ? { ...prev, answer: prev.answer.filter((_, i) => i !== index) }
        : null
    );
  };

  // Handle thay đổi answer type/value
  const handleAnswerChange = (
    isEdit: boolean,
    index: number,
    field: "type" | "value",
    value:
      | string
      | { key: string; url: string }
      | { key: string; url: string }[]
  ) => {
    const setter = isEdit ? setSelectedFAQ : setNewFAQ;
    setter((prev) => {
      if (!prev) return null;
      const newAnswer = [...prev.answer];
      if (field === "type") {
        newAnswer[index] = {
          ...newAnswer[index],
          type: value as "text" | "image" | "image_row",
          value: "",
        };
      } else {
        newAnswer[index] = { ...newAnswer[index], value };
      }
      return { ...prev, answer: newAnswer };
    });
  };

  // Handle upload ảnh lên Cloudinary
  const handleImageUpload = async (
    isEdit: boolean,
    index: number,
    files: FileList,
    isImageRow: boolean
  ) => {
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post(`upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const uploadResponse = response.data;

      if (
        uploadResponse.EC === 0 &&
        uploadResponse.data?.url &&
        uploadResponse.data?.public_id
      ) {
        const uploadedImage = {
          url: uploadResponse.data.url,
          key: uploadResponse.data.public_id,
        };

        if (isImageRow) {
          const setter = isEdit ? setSelectedFAQ : setNewFAQ;
          setter((prev) => {
            if (!prev) return null;
            const newAnswer = [...prev.answer];
            const currentAnswerItem = newAnswer[index];
            const existingImages =
              Array.isArray(currentAnswerItem.value) &&
              currentAnswerItem.type === "image_row"
                ? (currentAnswerItem.value as { key: string; url: string }[])
                : [];
            newAnswer[index] = {
              ...currentAnswerItem,
              value: [...existingImages, uploadedImage],
            };
            return { ...prev, answer: newAnswer };
          });
        } else {
          handleAnswerChange(isEdit, index, "value", uploadedImage);
        }
      } else {
        console.error("Image upload failed:", uploadResponse.EM);
        toast({
          title: "Error",
          description: "Image upload failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during image upload.",
        variant: "destructive",
      });
    }
  };

  // Apply latest FAQ
  const handleApplyLatest = () => {
    const latestFAQ = faqs[faqs.length - 1];
    if (latestFAQ) {
      setNewFAQ((prev) =>
        prev
          ? {
              ...prev,
              question: latestFAQ.question,
              answer: [...latestFAQ.answer],
              type: latestFAQ.type,
              status: latestFAQ.status,
              target_user: [...latestFAQ.target_user],
            }
          : null
      );
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Định nghĩa columns cho react-table
  const columns: ColumnDef<FAQ>[] = [
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
      accessorKey: "question",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Question
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("question")}</div>,
    },
    {
      accessorKey: "target_user",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Target User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const targetUsers = row.getValue("target_user") as string[];
        return <div>{targetUsers.join(", ") || "N/A"}</div>;
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("type")}</div>,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          {new Date(
            Number(row.getValue("created_at")) * 1000
          ).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const faq = row.original;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32">
              <div className="grid gap-4">
                <Button
                  variant="ghost"
                  className="flex items-center justify-start"
                  onClick={() => handleEdit(faq)}
                >
                  <span>Edit</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  ];

  const table = useReactTable({
    data: faqs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderAnswerRow = (
    item: AnswerItem,
    index: number,
    isEdit: boolean
  ) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-1/4">
            {item.type}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-32">
          <div className="grid gap-2">
            <Button
              variant="ghost"
              onClick={() => handleAnswerChange(isEdit, index, "type", "text")}
            >
              Text
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleAnswerChange(isEdit, index, "type", "image")}
            >
              Image
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                handleAnswerChange(isEdit, index, "type", "image_row")
              }
            >
              Image Row
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {item.type === "text" ? (
        <Input
          value={typeof item.value === "string" ? item.value : ""}
          onChange={(e) =>
            handleAnswerChange(isEdit, index, "value", e.target.value)
          }
          className="w-2/4"
        />
      ) : (
        <label className="w-2/4 flex items-center gap-2">
          <input
            type="file"
            multiple={item.type === "image_row"}
            hidden
            onChange={(e) =>
              e.target.files &&
              handleImageUpload(
                isEdit,
                index,
                e.target.files,
                item.type === "image_row"
              )
            }
          />
          {item.value && typeof item.value !== "string" && (
            <img
              src={
                Array.isArray(item.value)
                  ? item.value[0]?.url
                  : (item.value as { url: string }).url
              }
              alt="preview"
              className="w-12 h-12 rounded-md"
            />
          )}
          <span>{item.value ? "Change Image" : "Upload Image"}</span>
        </label>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddAnswerRow(isEdit)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteAnswerRow(isEdit, index)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <Spinner isVisible={isLoading} isOverlay />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">FAQs Manager</h1>
        <Button onClick={handleOpenAdd}>Add New FAQ</Button>
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
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

      {/* Modal chỉnh sửa FAQ */}
      {selectedFAQ && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Edit FAQ - {selectedFAQ.id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="question" className="text-right">
                  Question
                </Label>
                <Input
                  id="question"
                  value={selectedFAQ.question}
                  onChange={(e) => handleChangeEdit("question", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Answer</Label>
                {selectedFAQ.answer.map((item, index) =>
                  renderAnswerRow(item, index, true)
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={selectedFAQ.type}
                  onValueChange={(value) => handleChangeEdit("type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">SERVICE</SelectItem>
                    <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                    <SelectItem value="GENERAL">GENERAL</SelectItem>
                    <SelectItem value="PAYMENT">PAYMENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={selectedFAQ.status}
                  onValueChange={(value) => handleChangeEdit("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_user" className="text-right">
                  Target User
                </Label>
                <select
                  id="target_user"
                  multiple
                  value={selectedFAQ.target_user}
                  onChange={(e) =>
                    handleChangeEdit(
                      "target_user",
                      Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                    )
                  }
                  className="col-span-3 border rounded-md p-2 h-24"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="RESTAURANT">RESTAURANT</option>
                  <option value="CUSTOMER_CARE">CUSTOMER_CARE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isEditing}>
                {isEditing ? <Spinner isVisible /> : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal thêm FAQ mới */}
      {newFAQ && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="h-[90vh] w-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Add New FAQ</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="question" className="text-right">
                  Question
                </Label>
                <Input
                  id="question"
                  value={newFAQ.question}
                  onChange={(e) => handleChangeAdd("question", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <Label>Answer</Label>
                {newFAQ.answer.map((item, index) =>
                  renderAnswerRow(item, index, false)
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={newFAQ.type}
                  onValueChange={(value) => handleChangeAdd("type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">SERVICE</SelectItem>
                    <SelectItem value="ACCOUNT">ACCOUNT</SelectItem>
                    <SelectItem value="GENERAL">GENERAL</SelectItem>
                    <SelectItem value="PAYMENT">PAYMENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={newFAQ.status}
                  onValueChange={(value) => handleChangeAdd("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_user" className="text-right">
                  Target User
                </Label>
                <select
                  id="target_user"
                  multiple
                  value={newFAQ.target_user}
                  onChange={(e) =>
                    handleChangeAdd(
                      "target_user",
                      Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                    )
                  }
                  className="col-span-3 border rounded-md p-2 h-24"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="RESTAURANT">RESTAURANT</option>
                  <option value="CUSTOMER_CARE">CUSTOMER_CARE</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleApplyLatest}>
                Apply Latest FAQ
              </Button>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdd} disabled={isAdding}>
                {isAdding ? <Spinner isVisible /> : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Page;
