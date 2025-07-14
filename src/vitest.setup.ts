// vitest.setup.ts
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/vitest';
import "@testing-library/jest-dom"

// Vitestのexpectにjest-domのマッチャーを拡張
expect.extend(matchers);
