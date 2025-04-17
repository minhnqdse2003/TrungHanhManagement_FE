import React, { useEffect, useState } from "react";
import {
  Form,
  Table,
  Typography,
  Button,
  Modal,
  Input,
  Radio,
  Select,
  DatePicker,
  InputNumber,
  notification,
} from "antd";
import moment from "moment";
import { InboundRequestDetail } from "../../../types/inboundRequest";
import { parseToVietNameseCurrency } from "../../../utils/parseToVietNameseCurrency";

interface Batch {
  key: string;
  lotNumber: string;
  productId: number;
  productName: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ProductProps {
  productList: InboundRequestDetail[];
  onBatchChange?: (batches: Batch[]) => void;
  onListEmpty: () => void;
}

const InformationProduct: React.FC<ProductProps> = ({
  productList,
  onBatchChange,
  onListEmpty,
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [batchId, setBatchId] = useState("");
  const [productionDate, setProductionDate] = useState<moment.Moment | null>(
    null
  );
  const [expiryDate, setExpiryDate] = useState<moment.Moment | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedProductIndex, setSelectedProductIndex] = useState<
    string | null
  >(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableProducts, setAvailableProducts] =
    useState<InboundRequestDetail[]>(productList);

  // Update available products whenever productList changes
  useEffect(() => {
    setAvailableProducts(productList);
  }, [productList]);

  useEffect(() => {
    onBatchChange?.(batches);
  }, [batches]);

  const transformedProductList = availableProducts.map((item, index) => ({
    ...item,
    key: index.toString(),
  }));

  const productColumns = [
    {
      title: "Chọn",
      key: "select",
      render: (_: any, record: any) => (
        <Radio
          checked={selectedProductIndex === record.key}
          onChange={() => setSelectedProductIndex(record.key)}
        />
      ),
    },
    { title: "Tên sản phẩm", dataIndex: "productName", key: "productName" },
    { title: "Số Lượng", dataIndex: "quantity", key: "quantity" },
    {
      title: "Giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (unitPrice: number) => renderPrice(unitPrice),
    },
  ];

  const batchColumns = [
    { title: "Mã lô", dataIndex: "lotNumber", key: "lotNumber" },
    { title: "Tên sản phẩm", dataIndex: "productName", key: "productName" },
    { title: "Số Lượng", dataIndex: "quantity", key: "quantity" },
    {
      title: "Tổng tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (totalPrice: number) => renderPrice(totalPrice),
    },
  ];

  const handleCreateBatch = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setBatchId("");
    setProductionDate(null);
    setExpiryDate(null);
  };

  const handleOk = () => {
    if (!selectedProductIndex) return;

    const selectedProduct = transformedProductList.find(
      (item) => item.key === selectedProductIndex
    );

    if (!selectedProduct) return;

    const newQuantity = selectedProduct.quantity - selectedQuantity;

    if (newQuantity < 0) {
      notification.error({
        message: "Không đủ số lượng",
        description: `Có ${selectedProduct.quantity} sản phẩm nhưng nhập ${selectedQuantity}`,
      });
      return;
    }

    if (!productionDate || !expiryDate) {
      notification.error({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn ngày sản xuất và ngày hết hạn.",
      });
      return;
    }

    const newPrice = selectedQuantity * selectedProduct.unitPrice;

    const newBatch: Batch = {
      key: `${Date.now()}`,
      lotNumber: batchId,
      productId: selectedProduct.productId,
      productName: selectedProduct.productName,
      manufacturingDate: productionDate?.format("YYYY-MM-DD") || "",
      expiryDate: expiryDate?.format("YYYY-MM-DD") || "",
      quantity: selectedQuantity || 0,
      unitPrice: selectedProduct.unitPrice || 0,
      totalPrice: newPrice,
    };

    setBatches((prevBatches) => [...prevBatches, newBatch]);

    setAvailableProducts((prevProducts) => {
      if (newQuantity === 0) {
        return prevProducts.filter(
          (_, index) => index.toString() !== selectedProductIndex
        );
      }
      return prevProducts.map((item, index) => {
        if (index.toString() === selectedProductIndex) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });

    // Reset trạng thái
    setSelectedProductIndex(null);
    setBatchId("");
    setProductionDate(null);
    setExpiryDate(null);
    setSelectedQuantity(1);

    // Đóng modal
    setIsModalVisible(false);
    form.resetFields();
  };

  useEffect(() => {
    if (availableProducts.length === 0) {
      onListEmpty();
    }
  }, [availableProducts]);

  const selectedProductRadio = transformedProductList.find(
    (item) => item.key === selectedProductIndex
  );

  return (
    <Form form={form} layout="vertical">
      <Typography.Title level={4}>Danh sách sản phẩm</Typography.Title>
      <Button
        type="dashed"
        disabled={selectedProductIndex === null}
        style={{ marginBottom: 10 }}
        onClick={handleCreateBatch}
      >
        Tạo lô Hàng
      </Button>
      <Table
        bordered
        dataSource={transformedProductList}
        columns={productColumns}
        pagination={false}
        rowKey="key"
      />

      <Typography.Title level={4}>Danh sách lô hàng</Typography.Title>
      <Table
        bordered
        dataSource={batches}
        columns={batchColumns}
        pagination={false}
        rowKey="key"
      />

      <Modal
        title="Tạo Lô Hàng Mới"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Tạo"
        cancelText="Hủy"
        onClose={handleCancel}
      >
        <Form layout="vertical">
          <Form.Item label="Mã lô" required>
            <Input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Nhập mã lô"
            />
          </Form.Item>
          <Form.Item label="Số Lượng" required>
            <InputNumber
              value={selectedQuantity}
              onChange={(value) => setSelectedQuantity(value ?? 1)}
              placeholder="Nhập số lượng"
              min={1}
              max={selectedProductRadio?.quantity}
            />
          </Form.Item>

          <Form.Item
            label="NSX (Ngày sản xuất)"
            required
            style={{ display: "inline-block", width: "48%" }}
          >
            <DatePicker
              value={productionDate}
              onChange={(date) => setProductionDate(date)}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sản xuất"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="HSD (Hạn sử dụng)"
            required
            style={{ display: "inline-block", width: "48%", marginLeft: "4%" }}
          >
            <DatePicker
              value={expiryDate}
              onChange={(date) => setExpiryDate(date)}
              format="DD/MM/YYYY"
              placeholder="Chọn hạn sử dụng"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Form>
  );
};

export default InformationProduct;

const renderPrice = (price: number) => {
  return <p>{parseToVietNameseCurrency(price)}</p>;
};
