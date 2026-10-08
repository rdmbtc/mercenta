import {it,expect} from 'vitest';import {eventTone} from '@/components/product/OperatorEventMark';
it('blocked and failed events never acquire a success mark',()=>{expect(eventTone('BLOCKED')).toBe('blocked');expect(eventTone('FAILED')).toBe('blocked');expect(eventTone('CANCELLED')).toBe('stopped')});
it('quote and permission are not confirmed settlement',()=>{expect(eventTone('QUOTED')).toBe('proposal');expect(eventTone('AUTHORIZED')).toBe('proposal');expect(eventTone('PENDING')).toBe('pending')});
it('only recognized successful step statuses use a check; unknown remains neutral',()=>{expect(eventTone('OK')).toBe('success');expect(eventTone('VERIFIED')).toBe('success');expect(eventTone('unrecognized')).toBe('unknown')});
