"use client";

import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { usePdfTheme } from '@/context/ThemeContext';

interface EndPageProps {
  contactEmail?: string;
  contactPhone?: string;
  contactWebsite?: string;
  recommendations?: string[];
  additionalNotes?: string;
}

const EndPage: React.FC<EndPageProps> = ({
  contactEmail = 'contact@example.com',
  contactPhone,
  contactWebsite,
  recommendations = [],
  additionalNotes,
}) => {
  const { theme } = usePdfTheme();
  
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#ffffff',
      fontFamily: theme.fontFamily,
    },
    header: {
      fontSize: 24,
      color: theme.primaryColor,
      marginBottom: 20,
      textAlign: 'center',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      color: theme.primaryColor,
      marginBottom: 10,
      borderBottom: `1pt solid ${theme.secondaryColor}`,
      paddingBottom: 5,
    },
    recommendationItem: {
      marginBottom: 8,
      fontSize: 12,
    },
    notes: {
      fontSize: 12,
      lineHeight: 1.5,
      color: theme.secondaryColor,
      marginBottom: 30,
    },
    contactSection: {
      marginTop: 40,
      alignItems: 'center',
    },
    contactTitle: {
      fontSize: 14,
      color: theme.primaryColor,
      marginBottom: 15,
      textAlign: 'center',
    },
    contactItem: {
      fontSize: 12,
      marginBottom: 5,
      textAlign: 'center',
    },
    companyName: {
      fontSize: 16,
      color: theme.primaryColor,
      marginBottom: 10,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    logo: {
      width: 120,
      height: 40,
      objectFit: 'contain',
      marginBottom: 15,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      fontSize: 10,
      color: theme.secondaryColor,
    },
  });

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Thank You</Text>
      
      {recommendations && recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps & Recommendations</Text>
          {recommendations.map((recommendation, index) => (
            <Text key={index} style={styles.recommendationItem}>
              • {recommendation}
            </Text>
          ))}
        </View>
      )}
      
      {additionalNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Text style={styles.notes}>{additionalNotes}</Text>
        </View>
      )}
      
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>For any questions about this report, please contact us:</Text>
        
        {theme.logoUrl && (
          <Image src={theme.logoUrl} style={styles.logo} />
        )}
        
        <Text style={styles.companyName}>{theme.companyName}</Text>
        
        <Text style={styles.contactItem}>{contactEmail}</Text>
        
        {contactPhone && (
          <Text style={styles.contactItem}>{contactPhone}</Text>
        )}
        
        {contactWebsite && (
          <Text style={styles.contactItem}>{contactWebsite}</Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text>{theme.footerText}</Text>
      </View>
    </Page>
  );
};

export default EndPage; 