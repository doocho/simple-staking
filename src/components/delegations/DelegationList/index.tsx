import { useLanguage } from "@/app/contexts/LanguageContext";
import {
  ActionType,
  useDelegationService,
} from "@/app/hooks/services/useDelegationService";
import { translations } from "@/app/translations";
import { DelegationWithFP } from "@/app/types/delegationsV2";
import { GridTable, type TableColumn } from "@/components/common/GridTable";
import { Hint } from "@/components/common/Hint";
import { FinalityProviderMoniker } from "@/components/delegations/DelegationList/components/FinalityProviderMoniker";
import { getNetworkConfig } from "@/config/network";

import { ActionButton } from "./components/ActionButton";
import { Amount } from "./components/Amount";
import { DelegationModal } from "./components/DelegationModal";
import { Inception } from "./components/Inception";
import { Status } from "./components/Status";
import { TxHash } from "./components/TxHash";
import { NoDelegations } from "./NoDelegations";

type TableParams = {
  validations: Record<string, { valid: boolean; error?: string }>;
  handleActionClick: (action: ActionType, delegation: DelegationWithFP) => void;
};

const networkConfig = getNetworkConfig();

export function DelegationList() {
  const { language } = useLanguage();
  const t = translations[language].delegationList;

  const {
    processing,
    confirmationModal,
    delegations,
    isLoading,
    isFetchingNextPage,
    hasMoreDelegations,
    validations,
    fetchMoreDelegations,
    executeDelegationAction,
    openConfirmationModal,
    closeConfirmationModal,
  } = useDelegationService();

  const columns: TableColumn<DelegationWithFP, TableParams>[] = [
    {
      field: "Inception",
      headerName: t.inception,
      width: "minmax(max-content, 1fr)",
      renderCell: (row) => <Inception value={row.bbnInceptionTime} />,
    },
    {
      field: "finalityProvider",
      headerName: t.finalityProvider,
      width: "minmax(max-content, 1fr)",
      renderCell: (row) => <FinalityProviderMoniker value={row.fp} />,
    },
    {
      field: "stakingAmount",
      headerName: t.amount,
      width: "minmax(max-content, 1fr)",
      renderCell: (row) => <Amount value={row.stakingAmount} />,
    },
    {
      field: "stakingTxHashHex",
      headerName: t.transactionId,
      width: "minmax(max-content, 1fr)",
      renderCell: (row) => <TxHash value={row.stakingTxHashHex} />,
    },
    {
      field: "state",
      headerName: t.status,
      width: "minmax(max-content, 1fr)",
      renderCell: (row, _, { validations }) => {
        const { valid, error } = validations[row.stakingTxHashHex];
        if (!valid) return <Hint tooltip={error}>{t.unavailable}</Hint>;

        return <Status delegation={row} />;
      },
    },
    {
      field: "actions",
      headerName: t.action,
      width: "minmax(max-content, 0.5fr)",
      renderCell: (row, _, { handleActionClick, validations }) => {
        const { valid, error } = validations[row.stakingTxHashHex];

        // Hide the action button if the delegation is invalid
        if (!valid) return null;

        return (
          <ActionButton
            tooltip={error}
            delegation={row}
            onClick={handleActionClick}
          />
        );
      },
    },
  ];

  return (
    <div>
      {/* <Heading variant="h6" className="text-accent-primary py-2 mb-6">
        {networkConfig.bbn.networkFullName} Stakes
      </Heading> */}

      <GridTable
        getRowId={(row) => `${row.stakingTxHashHex}-${row.startHeight}`}
        columns={columns}
        data={delegations}
        loading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        infiniteScroll={hasMoreDelegations}
        onInfiniteScroll={fetchMoreDelegations}
        classNames={{
          headerRowClassName: "text-accent-primary text-xs",
          headerCellClassName: "p-4 text-align-left text-accent-secondary",
          rowClassName: "group",
          wrapperClassName: "max-h-[25rem] overflow-x-auto",
          bodyClassName: "min-w-[1000px]",
          cellClassName:
            "p-4 first:pl-4 first:rounded-l last:pr-4 last:rounded-r flex items-center text-sm justify-start text-accent-primary",
        }}
        params={{
          handleActionClick: openConfirmationModal,
          validations,
        }}
        fallback={<NoDelegations />}
      />

      <DelegationModal
        action={confirmationModal?.action}
        delegation={confirmationModal?.delegation ?? null}
        param={confirmationModal?.param ?? null}
        processing={processing}
        onSubmit={executeDelegationAction}
        onClose={closeConfirmationModal}
        networkConfig={networkConfig}
      />
    </div>
  );
}
