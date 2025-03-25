import React, { useEffect, useState } from "react";
import { LotGetRequestParams, LotGetView } from "../../../types/lot";
import { useGetLotQuery } from "../../../hooks/api/lot/getLotQuery";
import { formatDateTime } from "../../../utils/timeHelper";
import {
  Button,
  Card,
  Divider,
  InputNumber,
  Modal,
  notification,
  Pagination,
  PaginationProps,
  Table,
  TableProps,
  Tag,
} from "antd";
import styled from "styled-components";
import FilterComponent from "./FilterComponents";
import { TableRowSelection } from "antd/es/table/interface";
import {
  OutboundDetail,
  OutboundDetailRequest,
  OutboundPostRequest,
} from "../../../types/outbound";
import { DeleteOutlined } from "@ant-design/icons";

const initialQueryParams: LotGetRequestParams = {
  Page: 1,
  PageSize: 10,
  DateFrom: null,
  DateTo: null,
  Search: null,
};

type ProductsSelectedProps = OutboundDetailRequest &
  Pick<OutboundDetail, "lotNumber" | "productName">;

interface ProductInformationStepProps {
  formData: OutboundPostRequest;
  updateFormData: (data: Partial<OutboundPostRequest>) => void;
}
type ProductInformationStepFormProps = Pick<
  OutboundPostRequest,
  "outboundDetails"
>;

const ProductInformationStep = ({
  formData,
  updateFormData,
}: ProductInformationStepProps) => {
  const [queryParams, setQueryParams] =
    useState<LotGetRequestParams>(initialQueryParams);
  const { data } = useGetLotQuery(queryParams);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<
    ProductsSelectedProps[] | []
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const onClickAddProduct = () => {
    if (!data) {
      notification.error({
        message: "Không tồn tại dữ liệu",
        description: "Dữ liệu hiện tại không khả dụng để tiến hành tạo mới",
      });
      return;
    }

    const products = data.items.filter((lot) =>
      selectedRowKeys.includes(lot.lotId)
    );
    if (products.length <= 0) {
      notification.error({
        message: "Không có sản phẩm nào được thêm vào",
        description: "Sản phẩm bạn chọn hiện không tồn tại trong dữ liệu",
      });
      return;
    }

    const isExist = () => {
      const selectedProductIds = selectedProduct.map(
        (product) => product.lotId
      );
      const isProductsExist = products.every(
        (product) => !selectedProductIds.includes(product.lotId)
      );

      if (!isProductsExist) {
        notification.error({
          message: "Sản phẩm không hợp lệ",
          description: "Sản phẩm này đã tồn tại trong đơn",
        });
        return;
      }

      const productsMapping = products.map<ProductsSelectedProps>(
        (product) => ({
          lotId: product.lotId,
          quantity: 1,
          unitPrice: 1,
          lotNumber: product.lotNumber,
          productName: product.productName,
        })
      );
      setSelectedProduct((prev) => [...prev, ...productsMapping]);
      setSelectedRowKeys([]);
    };

    isExist();
  };

  const handleDelete = (lotId: number) => {
    const updatedProducts = selectedProduct.filter(
      (product) => product.lotId !== lotId
    );
    setSelectedProduct(updatedProducts);
  };

  const rowSelection: TableRowSelection<LotGetView> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  const lotColumns: TableProps<LotGetView>["columns"] = [
    {
      title: "Mã Lô",
      dataIndex: "lotNumber",
      key: "lotNumber",
      render: (_, { lotNumber }) => <p>{lotNumber}</p>,
    },
    {
      title: "Tên Kho",
      dataIndex: "warehouseName",
      key: "warehouseName",
      render: (_, { warehouseName }) => {
        if (warehouseName) {
          return <p>{warehouseName}</p>;
        }
        return <Tag color="warning">Chưa xác định</Tag>;
      },
    },
    {
      title: "Tên Sản Phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (_, { productName }) => {
        if (productName) {
          return <p>{productName}</p>;
        }
        return <Tag color="warning">Chưa xác định</Tag>;
      },
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: "providerName",
      key: "providerName",
      render: (_, { providerName }) => {
        if (providerName) {
          return <p>{providerName}</p>;
        }
        return <Tag color="warning">Chưa xác định</Tag>;
      },
    },
    {
      title: "Ngày Sản Xuất",
      dataIndex: "manufacturingDate",
      key: "manufacturingDate",
      render: (_, { manufacturingDate }) => {
        if (manufacturingDate) {
          return <p>{formatDateTime(new Date(manufacturingDate))}</p>;
        }
        return <Tag color="warning">Chưa xác định</Tag>;
      },
    },
    {
      title: "Ngày Hết Hạn",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (_, { expiryDate }) => {
        if (expiryDate) {
          return <p>{formatDateTime(new Date(expiryDate))}</p>;
        }
        return <Tag color="warning">Chưa xác định</Tag>;
      },
    },
  ];

  const productColumn: TableProps<ProductsSelectedProps>["columns"] = [
    {
      title: "Mã Lô",
      dataIndex: "lotNumber",
      key: "lotNumber",
      render: (lotNumber) => <span>{lotNumber}</span>,
    },
    {
      title: "Tên Sản Phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (productName) => <span>{productName}</span>,
    },
    {
      title: "Số Lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, _, index) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => handleChange(index, "quantity", value)}
        />
      ),
    },
    {
      title: "Đơn Giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (unitPrice, record, index) => (
        <InputNumber
          min={0}
          value={unitPrice}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          style={{ width: "100%", maxWidth: "12rem" }}
          parser={(value) => (value ? parseInt(value.replace(/\D/g, "")) : 0)}
          onChange={(value) => handleChange(index, "unitPrice", value)}
        />
      ),
    },
    {
      key: "action",
      render: (_, item) => (
        <DeleteOutlined
          style={{ color: "red", cursor: "pointer", fontSize: "16px" }}
          onClick={() => handleDelete(item.lotId)}
        />
      ),
    },
  ];

  const handleOnPageChange: PaginationProps["onChange"] = (page) => {
    setQueryParams((prev) => ({
      ...prev,
      Page: page,
    }));
  };

  const handleOnPageSizeChange: PaginationProps["onShowSizeChange"] = (
    _,
    pageSize
  ) => {
    setQueryParams((prev) => ({
      ...prev,
      PageSize: pageSize,
    }));
  };

  const handleChange = (
    index: number,
    field: keyof ProductsSelectedProps,
    value: number | null
  ) => {
    const newData = [...selectedProduct];
    newData[index] = { ...newData[index], [field]: value ?? 0 };
    setSelectedProduct(newData);
  };

  const handleSubmit = () => {
    console.log(formData);
  };

  useEffect(() => {
    const mapToFormData = () => {
      const outboundDetails: OutboundDetailRequest[] = selectedProduct.map(
        (product) => ({
          lotId: product.lotId,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
        })
      );

      const data: ProductInformationStepFormProps = {
        outboundDetails,
      };

      return data;
    };

    updateFormData(mapToFormData());
  }, [selectedProduct, updateFormData]);

  return (
    <>
      <StyledCard>
        <ListProductButton onClick={() => setIsModalOpen(true)}>
          {`Mặt hàng đã chọn (${selectedProduct.length})`}
        </ListProductButton>
        <FilterComponent
          initialQueryParams={initialQueryParams}
          setQuery={setQueryParams}
        />
        <CtaButton onClick={onClickAddProduct} disabled={!hasSelected}>
          Thêm vào đơn
        </CtaButton>
      </StyledCard>
      <StyledDivider orientation="left" orientationMargin={0}>
        Danh sách hàng tồn kho
      </StyledDivider>
      <Table<LotGetView>
        pagination={false}
        dataSource={data?.items}
        columns={lotColumns}
        rowSelection={rowSelection}
        rowKey={(record) => record.lotId}
      />
      {data && (
        <StyledPagination
          showSizeChanger
          align="end"
          style={{
            marginTop: "var(--line-width-light)",
          }}
          defaultCurrent={1}
          total={data?.totalCount}
          pageSize={data?.pageSize}
          current={queryParams.Page}
          onChange={handleOnPageChange}
          onShowSizeChange={handleOnPageSizeChange}
        />
      )}
      <CtaButton
        type="primary"
        onClick={handleSubmit}
        style={{ marginTop: 16 }}
      >
        Hoàn tất
      </CtaButton>

      <StyledModal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null} // Removes OK/Cancel buttons
        wrapClassName="ant-modal-fullscreen"
      >
        <StyledDivider orientation="left" orientationMargin={0}>
          Mặt hàng đã chọn
        </StyledDivider>
        <Table<ProductsSelectedProps>
          columns={productColumn}
          dataSource={selectedProduct}
          rowKey="lotId"
          pagination={false}
          scroll={{ y: "calc(100vh - 14rem)" }}
        />
      </StyledModal>
    </>
  );
};

export default ProductInformationStep;

const StyledPagination = styled(Pagination)`
  margin-top: var(--line-width-light);
`;

const CtaButton = styled(Button)`
  &:not(:disabled) {
    color: white !important;
  }
  border-color: transparent !important;
  background-color: var(--color-secondary-600);
  &:not(:disabled):hover {
    background-color: var(--color-secondary-500) !important;
  }
`;

const ListProductButton = styled(CtaButton)`
  width: fit-content;
  margin-bottom: var(--line-width-bold);
`;

const StyledCard = styled(Card)`
  margin-bottom: var(--line-width-regular);

  .ant-card-body {
    display: flex;
    flex-direction: column;
  }
`;

const StyledDivider = styled(Divider)`
  border-color: var(--color-placeholder) !important;
  color: var(--color-secondary-600) !important;
  font-weight: var(--font-weight-semibold) !important;
`;

const StyledModal = styled(Modal)``;
