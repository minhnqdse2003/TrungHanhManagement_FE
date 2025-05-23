import {
  Flex,
  Modal,
  notification,
  Pagination,
  PaginationProps,
  Spin,
  Table,
  TableProps,
  Tag,
} from "antd";
import React, { useEffect, useState } from "react";
import {
  Provider,
  ProviderGetRequestParams,
  ProviderStatusColors,
} from "../../../types/provider";
import styled from "styled-components";
import { useGetProviderQuery } from "../../../hooks/api/provider/getProviderQuery";
import ActionDropdown from "./components/DropdownOptions";
import FilterComponent from "./components/FilterComponent";
import DetailsModal from "./components/DetailsModal";
import EditModal from "./components/EditModal";
import { parseProviderStatusToVietnamese } from "../../../utils/translateProviderStatus";
import { useDeleteProviderMutation } from "../../../hooks/api/provider/deleteProviderMutation";

const initialData: ProviderGetRequestParams = {
  Page: 1,
  PageSize: 10,
};

const ProviderListPage = () => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Provider | null>(null);
  const [initParams, setInitParams] = useState<ProviderGetRequestParams>({
    Page: 1,
    PageSize: 10,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { mutate, isPending } = useDeleteProviderMutation();

  const { data, isLoading } = useGetProviderQuery(initParams);

  const columns: TableProps<Provider>["columns"] = [
    {
      title: "#",
      dataIndex: "providerId",
      key: "providerId",
      render: (providerId) => <strong>{providerId}</strong>,
    },
    {
      title: "Tên Nhà Cung Cấp",
      dataIndex: "providerName",
      key: "providerName",
      render: (_, { providerName }) => <p>{providerName}</p>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (_, { email }) => <p>{email}</p>,
    },
    {
      title: "Số Điện Thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (_, { phoneNumber }) => <p>{phoneNumber}</p>,
    },
    {
      title: "Mã Số Thuế",
      dataIndex: "taxCode",
      key: "taxCode",
      render: (_, { taxCode }) => <p>{taxCode}</p>,
    },
    {
      title: "Mã chứng từ",
      dataIndex: "documentNumber",
      key: "documentNumber",
      render: (_, { documentNumber }) => <p>{documentNumber}</p>,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (_, { status }) => {
        return (
          <Tag color={ProviderStatusColors[status - 1]}>
            {parseProviderStatusToVietnamese(status)}
          </Tag>
        );
      },
    },
    {
      key: "action",
      render: (_, item) => {
        const handleOnClickDetail = () => {
          setIsDetailModalOpen(true);
          setSelectedItem(item);
        };

        const handleOnClickEdit = () => {
          setIsEditModalOpen(true);
          setSelectedItem(item);
        };

        const handleOnClickDelete = () => {
          setIsDeleteModalOpen(true);
          setSelectedItem(item);
        };

        return (
          <ActionDropdown
            onDetail={handleOnClickDetail}
            onEdit={handleOnClickEdit}
            onDelete={handleOnClickDelete}
          />
        );
      },
    },
  ];

  const handleOnChange: PaginationProps["onChange"] = (page) => {
    setInitParams((prev) => ({
      ...prev,
      Page: page,
    }));
  };

  const handleOnShowSizeChange: PaginationProps["onShowSizeChange"] = (
    _,
    pageSize
  ) => {
    setInitParams((prev) => ({
      ...prev,
      PageSize: pageSize,
      Page: 1,
    }));
  };

  const handleConfirmDelete = () => {
    if (selectedItem?.providerId) {
      mutate(selectedItem.providerId, {
        onSuccess: () => handleCancelDelete(),
      });
    } else {
      notification.error({
        message: "Nhà cung cấp không được trống",
      });
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    if (!isEditModalOpen) {
      setSelectedItem(null);
    }
  }, [isEditModalOpen]);

  return (
    <>
      <FilterComponent
        initialQueryParams={initialData}
        setQuery={setInitParams}
      />
      {data && (
        <>
          <Table<Provider>
            bordered
            pagination={false}
            dataSource={data.items}
            columns={columns}
          />
          <StyledPagination
            showSizeChanger
            align="end"
            defaultCurrent={1}
            total={data.totalCount}
            pageSize={data.pageSize}
            current={initParams.Page}
            onChange={handleOnChange}
            onShowSizeChange={handleOnShowSizeChange}
          />
        </>
      )}
      {isLoading && (
        <Flex justify="center" align="center" style={{ height: "100%" }}>
          <Spin />
        </Flex>
      )}
      {selectedItem && (
        <>
          <DetailsModal
            isModalOpen={isDetailModalOpen}
            item={selectedItem}
            setIsModalOpen={setIsDetailModalOpen}
          />
          <EditModal
            isModalOpen={isEditModalOpen}
            item={selectedItem}
            setIsModalOpen={setIsEditModalOpen}
            queryParam={initParams}
          />

          <Modal
            title="Xác nhận xóa"
            open={isDeleteModalOpen}
            onOk={handleConfirmDelete}
            onCancel={handleCancelDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            loading={isPending}
          >
            <p>
              Bạn có chắc chắn muốn xóa nhà cung cấp{" "}
              {selectedItem?.providerName}?
            </p>
          </Modal>
        </>
      )}
    </>
  );
};

export default ProviderListPage;

const StyledPagination = styled(Pagination)`
  margin-top: var(--line-width-light);
`;
