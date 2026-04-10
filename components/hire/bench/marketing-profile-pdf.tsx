import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#f97316', // Mintax Primary Orange
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a', // Slate 900
  },
  orgName: {
    fontSize: 10,
    color: '#64748b', // Slate 500
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f97316',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bio: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#334155', // Slate 700
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  gridItem: {
    width: '33%',
    marginBottom: 15,
  },
  label: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  contactNotice: {
    backgroundColor: '#fff7ed',
    padding: 15,
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: '#f97316',
    marginTop: 40,
  },
  noticeText: {
    fontSize: 9,
    color: '#9a3412',
    fontStyle: 'italic',
  }
});

interface MarketingProfilePDFProps {
  candidate: any;
  organization: any;
}

export const MarketingProfilePDF = ({ candidate, organization }: MarketingProfilePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{candidate.firstName} {candidate.lastName[0]}.</Text>
          <Text style={styles.orgName}>{organization.name} Talent Pool</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f97316' }}>REF: {candidate.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>Exported on {new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Meta Grid */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Availability</Text>
          <Text style={styles.value}>{candidate.availabilityDate ? new Date(candidate.availabilityDate).toLocaleDateString() : 'Immediate'}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Hourly Rate</Text>
          <Text style={styles.value}>{candidate.hourlyRate ? `$${candidate.hourlyRate}/hr` : 'Market Rate'}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Work Authorization</Text>
          <Text style={styles.value}>{candidate.workAuthorization || 'Authorized'}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>Remote / On-site</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Seniority</Text>
          <Text style={styles.value}>Professional</Text>
        </View>
      </View>

      {/* Profile Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.bio}>
          {candidate.marketingBio || "No detailed summary provided. This candidate is currently available for short-term or long-term placement through our bench management program."}
        </Text>
      </View>

      {/* Additional Notes (Masked) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills & Background</Text>
        <Text style={styles.bio}>
          Experienced in professional workflows and operational management. Highly motivated and ready to contribute to client projects effectively. Full resume and professional references are available upon request.
        </Text>
      </View>

      {/* Contact Mask Section */}
      <View style={styles.contactNotice}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#9a3412', marginBottom: 4 }}>Contact Information Masked</Text>
        <Text style={styles.noticeText}>
          To protect candidate privacy and manage recruitment rights, direct contact details have been removed. 
          Please contact our team at {organization.name} to schedule an interview or request the full unmasked profile.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} {organization.name}. All rights reserved.</Text>
        <Text style={styles.footerText}>Powered by Mintax Recruitment hub</Text>
      </View>
    </Page>
  </Document>
);
