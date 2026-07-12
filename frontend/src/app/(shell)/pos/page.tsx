'use client';

import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useCallback, useMemo, useState } from 'react';
import { useSnackbar } from '@/shared/hooks';
import { FLOATING_CART_HEIGHT, BOTTOM_NAV_HEIGHT } from '@/shared/theme/breakpoints';
import {
  CartBottomSheet,
  CartPanel,
  CategoryChips,
  CloseShiftDialog,
  EmptyState,
  FavoriteMenuRow,
  FloatingCartBar,
  formatIdr,
  MenuGrid,
  MenuGridSkeleton,
  MenuSearchBar,
  OpenShiftDialog,
  PaymentBottomSheet,
  ReceiptPreviewSheet,
  resolveFavoriteMenus,
  useCreateOrder,
  useCurrentShift,
  useMenus,
  usePayOrder,
  useUpdateOrderItems,
  type CartLine,
  type Menu,
  type MenuCategoryCode,
  type Order,
  type PaymentMethod,
  type DiningType,
} from '@/features/pos';

function usePosCart() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [diningType, setDiningType] = useState<DiningType>('dine_in');

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.hargaJual * line.qty, 0),
    [cart],
  );

  const itemCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);

  const addMenu = useCallback((menu: Menu) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.kodeMenu === menu.kodeMenu);
      if (existing) {
        return prev.map((line) =>
          line.kodeMenu === menu.kodeMenu ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [
        ...prev,
        { kodeMenu: menu.kodeMenu, namaMenu: menu.namaMenu, hargaJual: menu.hargaJual, qty: 1 },
      ];
    });
  }, []);

  const increment = useCallback((kodeMenu: string) => {
    setCart((prev) =>
      prev.map((line) => (line.kodeMenu === kodeMenu ? { ...line, qty: line.qty + 1 } : line)),
    );
  }, []);

  const decrement = useCallback((kodeMenu: string) => {
    setCart((prev) =>
      prev
        .map((line) => (line.kodeMenu === kodeMenu ? { ...line, qty: line.qty - 1 } : line))
        .filter((line) => line.qty > 0),
    );
  }, []);

  const addQty = useCallback((kodeMenu: string, amount: number) => {
    setCart((prev) =>
      prev.map((line) => (line.kodeMenu === kodeMenu ? { ...line, qty: line.qty + amount } : line)),
    );
  }, []);

  const remove = useCallback((kodeMenu: string) => {
    setCart((prev) => prev.filter((line) => line.kodeMenu !== kodeMenu));
  }, []);

  const setNote = useCallback((kodeMenu: string, note: string) => {
    setCart((prev) =>
      prev.map((line) => (line.kodeMenu === kodeMenu ? { ...line, note: note || undefined } : line)),
    );
  }, []);

  const clear = useCallback(() => setCart([]), []);

  return {
    cart,
    diningType,
    total,
    itemCount,
    setDiningType,
    addMenu,
    increment,
    decrement,
    addQty,
    remove,
    setNote,
    clear,
  };
}

export default function PosPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { enqueueSnackbar } = useSnackbar();

  const { data: menus = [], isLoading: menusLoading } = useMenus();
  const { data: currentShift, isLoading: shiftLoading } = useCurrentShift();

  const [activeCategory, setActiveCategory] = useState<MenuCategoryCode | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);

  const cartState = usePosCart();
  const createOrderMutation = useCreateOrder();
  const updateItemsMutation = useUpdateOrderItems();
  const payOrderMutation = usePayOrder();

  const favoriteMenus = useMemo(() => resolveFavoriteMenus(menus), [menus]);

  const paying =
    createOrderMutation.isPending || updateItemsMutation.isPending || payOrderMutation.isPending;

  const handlePay = async (paymentMethod: PaymentMethod, paidAmount: number) => {
    if (cartState.cart.length === 0) return;

    try {
      const draft = await createOrderMutation.mutateAsync({ diningType: cartState.diningType });
      const updated = await updateItemsMutation.mutateAsync({
        orderId: draft.id,
        body: {
          items: cartState.cart.map((line) => ({
            kodeMenu: line.kodeMenu,
            qty: line.qty,
            note: line.note,
          })),
        },
      });
      const paid = await payOrderMutation.mutateAsync({
        orderId: updated.id,
        body: { paymentMethod, paidAmount },
      });

      setPaymentOpen(false);
      setCartOpen(false);
      cartState.clear();
      setPaidOrder(paid);
      setReceiptPreviewOpen(true);
      enqueueSnackbar('Pembayaran berhasil', { variant: 'success' });
    } catch {
      enqueueSnackbar('Gagal memproses pembayaran', { variant: 'error' });
    }
  };

  const openPayment = () => {
    if (!currentShift) {
      enqueueSnackbar('Buka shift terlebih dahulu', { variant: 'warning' });
      return;
    }
    if (cartState.cart.length === 0) return;
    setPaymentOpen(true);
  };

  if (menusLoading || shiftLoading) {
    return (
      <Box>
        <MenuGridSkeleton />
      </Box>
    );
  }

  const shiftReady = Boolean(currentShift);

  return (
    <>
      <OpenShiftDialog open={!shiftReady} />

      {currentShift ? (
        <CloseShiftDialog
          open={closeShiftOpen}
          shiftId={currentShift.id}
          onClose={() => setCloseShiftOpen(false)}
        />
      ) : null}

      <PaymentBottomSheet
        open={paymentOpen}
        total={cartState.total}
        loading={paying}
        onClose={() => setPaymentOpen(false)}
        onConfirm={(method, paidAmount) => void handlePay(method, paidAmount)}
      />

      <CartBottomSheet
        open={cartOpen}
        cart={cartState.cart}
        diningType={cartState.diningType}
        total={cartState.total}
        disabled={!shiftReady}
        paying={paying}
        onClose={() => setCartOpen(false)}
        onDiningTypeChange={cartState.setDiningType}
        onIncrement={cartState.increment}
        onDecrement={cartState.decrement}
        onAddQty={cartState.addQty}
        onRemove={cartState.remove}
        onNoteChange={cartState.setNote}
        onClear={cartState.clear}
        onPay={openPayment}
      />

      <ReceiptPreviewSheet
        open={receiptPreviewOpen}
        order={paidOrder}
        onClose={() => {
          setReceiptPreviewOpen(false);
          setPaidOrder(null);
        }}
      />

      {!isDesktop ? (
        <FloatingCartBar
          itemCount={cartState.itemCount}
          total={cartState.total}
          disabled={!shiftReady}
          bottomOffset={BOTTOM_NAV_HEIGHT}
          onOpenCart={() => setCartOpen(true)}
          onPay={openPayment}
        />
      ) : null}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          pb: !isDesktop && cartState.itemCount > 0 ? `${FLOATING_CART_HEIGHT}px` : 0,
        }}
      >
        {!shiftReady ? (
          <EmptyState
            emoji="🔐"
            title="Shift belum dibuka"
            description="Buka shift di menu Shift sebelum menerima pesanan."
          />
        ) : null}

        {isDesktop && currentShift ? (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
              Shift aktif · Kas awal {formatIdr(currentShift.openingCash)}
            </Box>
          </Box>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
            gap: 2,
            alignItems: 'start',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            <MenuSearchBar value={searchQuery} onChange={setSearchQuery} />
            <CategoryChips activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            <FavoriteMenuRow menus={favoriteMenus} onAdd={cartState.addMenu} />
            <MenuGrid
              menus={menus}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              onAddMenu={cartState.addMenu}
            />
          </Box>

          {isDesktop ? (
            <Box sx={{ position: 'sticky', top: 80 }}>
              <CartPanel
                cart={cartState.cart}
                diningType={cartState.diningType}
                total={cartState.total}
                disabled={!shiftReady}
                paying={paying}
                onDiningTypeChange={cartState.setDiningType}
                onIncrement={cartState.increment}
                onDecrement={cartState.decrement}
                onRemove={cartState.remove}
                onNoteChange={cartState.setNote}
                onClear={cartState.clear}
                onPay={openPayment}
              />
            </Box>
          ) : null}
        </Box>
      </Box>
    </>
  );
}
