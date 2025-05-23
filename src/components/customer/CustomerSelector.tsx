import { useDebounce } from "@uidotdev/usehooks";
import { RefSelectProps, Select, Spin, Table, TableProps, Empty } from "antd";
import { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { CustomerSelectorGetView } from "../../types/customer";

interface CustomerSelectorProps {
  value: number | null | undefined;
  onSelectedCustomerChange: (customer: CustomerSelectorGetView | null) => void;
  onSearchValueChange: (value: string) => void;
  customers: CustomerSelectorGetView[] | undefined;
  loading?: boolean;
  placeholder?: string;
}

const CustomerSelector = ({
  value,
  onSelectedCustomerChange,
  onSearchValueChange,
  customers,
  loading = false,
  placeholder = "Chọn khách hàng",
}: CustomerSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectRef = useRef<RefSelectProps>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    onSearchValueChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchValueChange]);

  const handleRowClick = (record: CustomerSelectorGetView) => {
    onSelectedCustomerChange(record);
    setDropdownOpen(false);
    setSearchTerm("");
    selectRef.current?.blur();
  };

  const columns: TableProps<CustomerSelectorGetView>["columns"] = [
    { title: "Tên khách hàng", dataIndex: "customerName", key: "customerName" },
    { title: "Địa điểm", dataIndex: "address", key: "address" },
    { title: "Số điện thoại", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "Email", dataIndex: "email", key: "email" },
  ];

  const selectedCustomer = customers?.find((c) => c.customerId === value);

  return (
    <StyledSelect
      ref={selectRef}
      placeholder={placeholder}
      showSearch
      allowClear
      value={value}
      onSearch={setSearchTerm}
      onFocus={() => setDropdownOpen(true)}
      onClear={() => onSelectedCustomerChange(null)}
      onBlur={() => !isHovered && setDropdownOpen(false)}
      popupClassName="dropdownClassNameSelector"
      open={dropdownOpen}
      dropdownRender={() => {
        if (loading) {
          return (
            <SpinWrapper>
              <Spin />
            </SpinWrapper>
          );
        }
        if (customers && customers.length > 0) {
          return (
            <Table
              bordered
              columns={columns}
              dataSource={customers}
              rowKey="warehouseId"
              pagination={false}
              rowClassName="rowTableClassName"
              size="small"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false),
              })}
            />
          );
        }
        return (
          <EmptyWrapper>
            <Empty description="Không tìm thấy khách hàng" />
          </EmptyWrapper>
        );
      }}
      optionLabelProp="label"
      dropdownStyle={{ minWidth: "400px" }}
    >
      {selectedCustomer && (
        <Select.Option
          key={selectedCustomer.customerId}
          value={selectedCustomer.customerId}
          label={`${selectedCustomer.customerName} (${selectedCustomer.phoneNumber})`}
        >
          {selectedCustomer.customerName}
        </Select.Option>
      )}
    </StyledSelect>
  );
};

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: 2rem !important;
    width: 100%;
    display: flex;
    align-items: center;
  }
  .ant-select-dropdown {
    padding: 0 !important;
  }
`;

const SpinWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
`;

const EmptyWrapper = styled.div`
  padding: 16px;
  text-align: center;
`;

export default CustomerSelector;
