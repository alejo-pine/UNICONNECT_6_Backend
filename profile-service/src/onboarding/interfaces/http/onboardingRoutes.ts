import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import {
  getOnboardingStatus,
  markOnboardingRequired,
  saveOnboardingStepOne,
  saveOnboardingContact,
  completeOnboarding,
  getOnboardingPrograms,
} from './onboardingController';

const router: Router = Router();

/**
 * @openapi
 * /onboarding/status:
 *   get:
 *     summary: Get onboarding status
 *     tags: [Onboarding]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Status response
 */
router.get('/status', asyncHandler(getOnboardingStatus));
/**
 * @openapi
 * /status/{profileId}:
 *   get:
 *     summary: GET /status/{profileId}
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
/**
 * @openapi
 * /status/{profileId}:
 *   get:
 *     summary: GET /status/{profileId}
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get('/status/:profileId', asyncHandler(getOnboardingStatus));

/**
 * @openapi
 * /onboarding/programs:
 *   get:
 *     summary: Get onboarding programs
 *     tags: [Onboarding]
 *     responses:
 *       200:
 *         description: Programs list
 */
router.get('/programs', asyncHandler(getOnboardingPrograms));

/**
 * @openapi
 * /onboarding/mark:
 *   post:
 *     summary: Mark onboarding required
 *     tags: [Onboarding]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Marked required
 */
router.post('/mark', asyncHandler(markOnboardingRequired));

/**
 * @openapi
 * /onboarding/step-1:
 *   post:
 *     summary: Save step 1
 *     tags: [Onboarding]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               career:
 *                 type: string
 *               semester:
 *                 type: number
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Step 1 saved
 */
/**
 * @openapi
 * /step-1:
 *   post:
 *     summary: POST /step-1
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.post('/step-1', asyncHandler(saveOnboardingStepOne));
/**
 * @openapi
 * /step-one:
 *   post:
 *     summary: POST /step-one
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.post('/step-one', asyncHandler(saveOnboardingStepOne));

/**
 * @openapi
 * /onboarding/step-1/contact:
 *   patch:
 *     summary: Update contact
 *     tags: [Onboarding]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact updated
 */
/**
 * @openapi
 * /step-1/contact:
 *   patch:
 *     summary: PATCH /step-1/contact
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.patch('/step-1/contact', asyncHandler(saveOnboardingContact));
/**
 * @openapi
 * /contact:
 *   post:
 *     summary: POST /contact
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.post('/contact', asyncHandler(saveOnboardingContact));

/**
 * @openapi
 * /onboarding/complete:
 *   post:
 *     summary: Complete onboarding
 *     tags: [Onboarding]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Onboarding completed
 */
router.post('/complete', asyncHandler(completeOnboarding));

export default router;
