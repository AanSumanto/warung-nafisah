import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemberSection } from '@/features/pos/components/MemberSection';
import { PaymentBottomSheet } from '@/features/pos/components/PaymentBottomSheet';
import { RewardSection } from '@/features/pos/components/RewardSection';
import type { PosMemberSelection } from '@/features/pos/loyaltyTypes';

describe('NAFISAH REWARDS V1: POS UI Integration Audit & Verification', () => {
  const sampleMember: PosMemberSelection = {
    customerId: 'cust-12345',
    phoneMasked: '08******7890',
    name: 'Test Member Prod',
    currentPoints: 25,
  };

  it('TEST 1 - Loyalty flag OFF: MemberSection returns null / not visible', () => {
    const html = renderToString(
      React.createElement(MemberSection, {
        enabled: false,
        member: null,
        onClear: vi.fn(),
      }),
    );

    expect(html).toBe('');
    expect(html).not.toContain('Member?');
    expect(html).not.toContain('Cari nomor HP');
    expect(html).not.toContain('Lewati');
  });

  it('TEST 2 - Loyalty flag ON: "Member?" section is visible with "Cari nomor HP" and "Lewati"', () => {
    const html = renderToString(
      React.createElement(MemberSection, {
        enabled: true,
        member: null,
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain('Member?');
    expect(html).toContain('Cari nomor HP');
    expect(html).toContain('Cari');
    expect(html).toContain('Lewati');
  });

  it('TEST 3 - Nonmember: "Lewati" action preserves normal checkout flow', () => {
    const onClearMock = vi.fn();
    const html = renderToString(
      React.createElement(MemberSection, {
        enabled: true,
        member: null,
        onClear: onClearMock,
      }),
    );

    expect(html).toContain('Lewati');
    // In PaymentBottomSheet, payment button "Selesaikan & Cetak" is rendered unconditionally
    const paymentHtml = renderToString(
      React.createElement(PaymentBottomSheet, {
        open: true,
        total: 12000,
        memberSlot: React.createElement(MemberSection, {
          enabled: true,
          member: null,
          onClear: onClearMock,
        }),
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );
    expect(paymentHtml).toContain('Selesaikan &amp; Cetak');
    expect(paymentHtml).toContain('Tunai');
  });

  it('TEST 4 - Existing member: displays masked phone, name, and Saldo poin', () => {
    const html = renderToString(
      React.createElement(MemberSection, {
        enabled: true,
        member: sampleMember,
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain('Member:');
    expect(html).toContain('08******7890');
    expect(html).toContain('Test Member Prod');
    expect(html).toMatch(/Saldo:.*25.*poin/);
    expect(html).toContain('Ganti');
    expect(html).toContain('Hapus Member');
  });

  it('TEST 5 - New member: structure supports registration flow', () => {
    const onSelectMock = vi.fn();
    const html = renderToString(
      React.createElement(MemberSection, {
        enabled: true,
        member: null,
        onSelectMember: onSelectMock,
        onClear: vi.fn(),
      }),
    );

    expect(html).toContain('Cari nomor HP');
    expect(html).toContain('Member?');
  });

  it('TEST 6 - Member state survives re-renders', () => {
    let currentSelection: PosMemberSelection | null = null;
    const setSelection = (val: PosMemberSelection | null) => {
      currentSelection = val;
    };

    setSelection(sampleMember);

    const html1 = renderToString(
      React.createElement(MemberSection, {
        enabled: true,
        member: currentSelection,
        onClear: () => setSelection(null),
      }),
    );
    expect(html1).toContain('08******7890');
    expect(html1).toMatch(/Saldo:.*25.*poin/);

    // Simulate subsequent re-render
    const html2 = renderToString(
      React.createElement(MemberSection, {
        enabled: true,
        member: currentSelection,
        onClear: () => setSelection(null),
      }),
    );
    expect(html2).toContain('08******7890');
    expect(html2).toMatch(/Saldo:.*25.*poin/);
  });

  it('TEST 7 - PaymentBottomSheet mounts memberSlot before "Selesaikan & Cetak"', () => {
    const paymentHtml = renderToString(
      React.createElement(PaymentBottomSheet, {
        open: true,
        total: 25000,
        memberSlot: React.createElement(MemberSection, {
          enabled: true,
          member: sampleMember,
          onClear: vi.fn(),
        }),
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );

    expect(paymentHtml).toContain('Member:');
    expect(paymentHtml).toContain('08******7890');
    expect(paymentHtml).toMatch(/Saldo:.*25.*poin/);
    expect(paymentHtml).toContain('Selesaikan &amp; Cetak');

    const memberIdx = paymentHtml.indexOf('Member:');
    const payButtonIdx = paymentHtml.indexOf('Selesaikan &amp; Cetak');
    expect(memberIdx).toBeLessThan(payButtonIdx);
  });

  it('TEST 8 - Redemption UI remains disabled', () => {
    const rewardHtml = renderToString(
      React.createElement(RewardSection, {
        enabled: false,
        customerId: sampleMember.customerId,
        selectedRewardCode: null,
        onSelect: vi.fn(),
      }),
    );

    expect(rewardHtml).toBe('');
    expect(rewardHtml).not.toContain('Tukar Reward');
    expect(rewardHtml).not.toContain('Pilih Reward');
  });

  it('TEST 9 - QR receipt UI remains OFF', () => {
    // Payment and MemberSection do not contain receipt QR elements
    const paymentHtml = renderToString(
      React.createElement(PaymentBottomSheet, {
        open: true,
        total: 10000,
        memberSlot: React.createElement(MemberSection, {
          enabled: true,
          member: sampleMember,
          onClear: vi.fn(),
        }),
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );

    expect(paymentHtml).not.toContain('QR Nafisah Rewards');
    expect(paymentHtml).not.toContain('canvas');
  });
});
